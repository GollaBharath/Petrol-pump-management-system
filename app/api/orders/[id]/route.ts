import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
	authenticate,
	successResponse,
	errorResponse,
	requireRole,
} from "@/lib/auth";
import { MarkOrderDeliveredSchema } from "@/lib/validation";
import { createAuditLog } from "@/lib/db-utils";

interface RouteParams {
	params: {
		id: string;
	};
}

/**
 * GET /api/orders/[id]
 * Get order details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
	try {
		const authResult = await authenticate(request);
		if (authResult instanceof NextResponse) return authResult;

		const authRequest = authResult as any;
		const { id } = params;

		const order = await prisma.order.findUnique({
			where: { id },
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
		});

		if (!order) {
			return errorResponse("Order not found", 404);
		}

		// Check access: customer can only see their own orders
		if (
			authRequest.user.role === "CUSTOMER" &&
			order.customerId !== authRequest.user.id
		) {
			return errorResponse("Unauthorized", 403);
		}

		return successResponse({ order });
	} catch (error: any) {
		console.error("Order fetch error:", error);
		return errorResponse("Failed to fetch order", 500);
	}
}

/**
 * PATCH /api/orders/[id]/deliver
 * Mark order as delivered and complete billing (employees and admins only)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
	try {
		const authResult = await authenticate(request);
		if (authResult instanceof NextResponse) return authResult;

		const authRequest = authResult as any;
		const roleCheck = requireRole("EMPLOYEE", "ADMIN")(authRequest);
		if (roleCheck) return roleCheck;

		const { id } = params;
		const body = await request.json();
		const validatedData = MarkOrderDeliveredSchema.parse(body);

		const order = await prisma.order.findUnique({
			where: { id },
			include: {
				customer: {
					include: {
						customerProfile: true,
					},
				},
			},
		});

		if (!order) {
			return errorResponse("Order not found", 404);
		}

		if (order.status !== "PENDING") {
			return errorResponse("Order is not pending", 400);
		}

		// Get current fuel price
		const { getFuelPrice } = await import("@/lib/db-utils");
		const pricePerLiter = await getFuelPrice(order.fuelType);

		if (!pricePerLiter) {
			return errorResponse("No fuel price available", 400);
		}

		// Calculate total amount (fuel cost + cash)
		const totalAmount =
			validatedData.quantityDelivered * pricePerLiter + (order.cash ?? 0);

		// Update order and customer profile in a transaction
		const result = await prisma.$transaction(async (tx) => {
			// Update order
			const updatedOrder = await tx.order.update({
				where: { id },
				data: {
					status: "COMPLETED",
					quantityDelivered: validatedData.quantityDelivered,
					pricePerLiter,
					totalAmount,
					deliveredAt: new Date(),
					completedAt: new Date(),
				},
				include: {
					customer: {
						select: {
							id: true,
							fullName: true,
							email: true,
						},
					},
				},
			});

			// Update customer profile balance (negative = customer owes money)
			if (order.customer.customerProfile) {
				await tx.customerProfile.update({
					where: { id: order.customer.customerProfile.id },
					data: {
						currentBalance: {
							decrement: totalAmount,
						},
						totalOrders: {
							increment: 1,
						},
						totalPurchases: {
							increment: totalAmount,
						},
					},
				});
			}

			return updatedOrder;
		});

		// Log this action
		await createAuditLog(authRequest.user.id, "ORDER_COMPLETED", "orders", id, {
			quantityDelivered: validatedData.quantityDelivered,
			pricePerLiter,
			totalAmount,
			cash: order.cash ?? 0,
			previousStatus: order.status,
			timestamp: new Date().toISOString(),
		});

		return successResponse({
			message: "Order completed successfully",
			order: result,
		});
	} catch (error: any) {
		console.error("Order delivery error:", error);
		if (error.name === "ZodError") {
			return errorResponse("Validation error", 400, error.errors);
		}
		return errorResponse("Failed to update order", 500);
	}
}
