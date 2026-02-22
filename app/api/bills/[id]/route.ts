import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
	authenticate,
	requireRole,
	successResponse,
	errorResponse,
} from "@/lib/auth";
import { createAuditLog } from "@/lib/db-utils";
import { reversePayment } from "@/lib/billing-utils";

interface RouteParams {
	params: {
		id: string;
	};
}

/**
 * GET /api/bills/[id]
 * Get payment details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
	try {
		const authResult = await authenticate(request);
		if (authResult instanceof NextResponse) return authResult;

		const authRequest = authResult as any;
		const { id } = params;

		const payment = await prisma.payment.findUnique({
			where: { id },
			include: {
				customerProfile: {
					include: {
						user: {
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

		if (!payment) {
			return errorResponse("Payment not found", 404);
		}

		// Check access: customer can only see payments on their own profile
		if (authRequest.user.role === "CUSTOMER") {
			const profile = await prisma.customerProfile.findUnique({
				where: { userId: authRequest.user.id },
			});
			if (!profile || profile.id !== payment.customerProfileId) {
				return errorResponse("Unauthorized", 403);
			}
		}

		return successResponse({ payment });
	} catch (error: any) {
		console.error("Payment fetch error:", error);
		return errorResponse("Failed to fetch payment", 500);
	}
}

/**
 * DELETE /api/bills/[id]
 * Reverse / delete a payment (admins only)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
	try {
		const authResult = await authenticate(request);
		if (authResult instanceof NextResponse) return authResult;

		const authRequest = authResult as any;
		const roleCheck = requireRole("ADMIN")(authRequest);
		if (roleCheck) return roleCheck;

		const { id } = params;
		const reversed = await reversePayment(id);

		await createAuditLog(
			authRequest.user.id,
			"PAYMENT_REVERSED",
			"payments",
			id,
			{
				customerProfileId: reversed.customerProfileId,
				amount: reversed.amount,
				timestamp: new Date().toISOString(),
			},
		);

		return successResponse({ message: "Payment reversed successfully" });
	} catch (error: any) {
		console.error("Payment reverse error:", error);
		return errorResponse(error.message || "Failed to reverse payment", 500);
	}
}
