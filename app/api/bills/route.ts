import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
	authenticate,
	requireRole,
	successResponse,
	errorResponse,
} from "@/lib/auth";
import { CreateBillSchema } from "@/lib/validation";
import { createAuditLog, getFuelPrice } from "@/lib/db-utils";

/**
 * POST /api/bills
 * Generate a bill for a delivered order (admins only)
 */
export async function POST(request: NextRequest) {
	try {
		const authResult = await authenticate(request);
		if (authResult instanceof NextResponse) return authResult;

		const authRequest = authResult as any;
		const roleCheck = requireRole("ADMIN")(authRequest);
		if (roleCheck) return roleCheck;

		const body = await request.json();
		const validatedData = CreateBillSchema.parse(body);

		// Get the order
		const order = await prisma.order.findUnique({
			where: { id: validatedData.orderId },
			include: { bills: true },
		});

		if (!order) {
			return errorResponse("Order not found", 404);
		}

		if (order.status !== "DELIVERED") {
			return errorResponse("Order must be delivered before billing", 400);
		}

		if (order.bills.length > 0) {
			return errorResponse("Bill already exists for this order", 400);
		}

		if (!order.deliveredAt) {
			return errorResponse("Order does not have a delivery date", 400);
		}

		// Get the price on the delivery date
		const pricePerLiter = await getFuelPrice(order.fuelType, order.deliveredAt);
		if (!pricePerLiter) {
			return errorResponse("No price available for the delivery date", 400);
		}

		// Calculate amounts
		const totalAmount = validatedData.quantityDelivered * pricePerLiter;
		const netAmount =
			totalAmount + order.cashAdvance + validatedData.adjustments;

		// Create bill
		const bill = await prisma.bill.create({
			data: {
				orderId: validatedData.orderId,
				quantityDelivered: validatedData.quantityDelivered,
				pricePerLiter,
				totalAmount,
				cashAdvance: order.cashAdvance,
				adjustments: validatedData.adjustments,
				netAmount,
				status: "BILLED",
			},
		});

		// Update order status to BILLED
		await prisma.order.update({
			where: { id: validatedData.orderId },
			data: { status: "BILLED" },
		});

		// Log this action
		await createAuditLog(
			authRequest.user.id,
			"BILL_GENERATED",
			"bills",
			bill.id,
			{
				orderId: validatedData.orderId,
				quantityDelivered: validatedData.quantityDelivered,
				pricePerLiter,
				totalAmount,
				netAmount,
				timestamp: new Date().toISOString(),
			},
		);

		return successResponse(
			{
				message: "Bill generated successfully",
				bill,
			},
			201,
		);
	} catch (error: any) {
		console.error("Bill generation error:", error);
		if (error.name === "ZodError") {
			return errorResponse("Validation error", 400, error.errors);
		}
		return errorResponse("Failed to generate bill", 500);
	}
}

/**
 * GET /api/bills
 * List all bills (admins only)
 */
export async function GET(request: NextRequest) {
	try {
		const authResult = await authenticate(request);
		if (authResult instanceof NextResponse) return authResult;

		const authRequest = authResult as any;
		const roleCheck = requireRole("ADMIN")(authRequest);
		if (roleCheck) return roleCheck;

		const { searchParams } = new URL(request.url);
		const status = searchParams.get("status");
		const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
		const offset = parseInt(searchParams.get("offset") || "0");

		const where: any = {};
		if (status) {
			where.status = status;
		}

		const [bills, total] = await Promise.all([
			prisma.bill.findMany({
				where,
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
				orderBy: { createdAt: "desc" },
				take: limit,
				skip: offset,
			}),
			prisma.bill.count({ where }),
		]);

		return successResponse({
			bills,
			pagination: {
				total,
				limit,
				offset,
				page: Math.floor(offset / limit) + 1,
				pages: Math.ceil(total / limit),
			},
		});
	} catch (error: any) {
		console.error("Bills fetch error:", error);
		return errorResponse("Failed to fetch bills", 500);
	}
}
