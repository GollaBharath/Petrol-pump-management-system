import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
	authenticate,
	requireRole,
	successResponse,
	errorResponse,
} from "@/lib/auth";
import { MarkBillPaidSchema } from "@/lib/validation";
import { createAuditLog } from "@/lib/db-utils";

interface RouteParams {
	params: {
		id: string;
	};
}

/**
 * GET /api/bills/[id]
 * Get bill details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
	try {
		const authResult = await authenticate(request);
		if (authResult instanceof NextResponse) return authResult;

		const authRequest = authResult as any;
		const { id } = params;

		const bill = await prisma.bill.findUnique({
			where: { id },
			include: {
				order: {
					include: {
						customer: {
							select: {
								id: true,
								fullName: true,
								email: true,
								phone: true,
							},
						},
					},
				},
			},
		});

		if (!bill) {
			return errorResponse("Bill not found", 404);
		}

		// Check access: customer can see their own bills
		if (
			authRequest.user.role === "CUSTOMER" &&
			bill.order.customerId !== authRequest.user.id
		) {
			return errorResponse("Unauthorized", 403);
		}

		return successResponse({ bill });
	} catch (error: any) {
		console.error("Bill fetch error:", error);
		return errorResponse("Failed to fetch bill", 500);
	}
}

/**
 * PATCH /api/bills/[id]/mark-paid
 * Mark bill as paid (admins only)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
	try {
		const authResult = await authenticate(request);
		if (authResult instanceof NextResponse) return authResult;

		const authRequest = authResult as any;
		const roleCheck = requireRole("ADMIN")(authRequest);
		if (roleCheck) return roleCheck;

		const { id } = params;
		const body = await request.json();
		const validatedData = MarkBillPaidSchema.parse(body);

		const bill = await prisma.bill.findUnique({
			where: { id },
		});

		if (!bill) {
			return errorResponse("Bill not found", 404);
		}

		if (bill.status === "PAID") {
			return errorResponse("Bill is already paid", 400);
		}

		const updatedBill = await prisma.bill.update({
			where: { id },
			data: {
				status: "PAID",
				paidAt: new Date(),
			},
			include: {
				order: {
					include: {
						customer: {
							select: {
								id: true,
								fullName: true,
								email: true,
							},
						},
					},
				},
			},
		});

		// Update order status to PAID
		await prisma.order.update({
			where: { id: bill.orderId },
			data: { status: "PAID" },
		});

		// Log this action
		await createAuditLog(authRequest.user.id, "BILL_MARKED_PAID", "bills", id, {
			amount: bill.netAmount,
			paymentMethod: validatedData.paymentMethod,
			notes: validatedData.notes,
			timestamp: new Date().toISOString(),
		});

		return successResponse({
			message: "Bill marked as paid",
			bill: updatedBill,
		});
	} catch (error: any) {
		console.error("Bill payment error:", error);
		if (error.name === "ZodError") {
			return errorResponse("Validation error", 400, error.errors);
		}
		return errorResponse("Failed to mark bill as paid", 500);
	}
}
