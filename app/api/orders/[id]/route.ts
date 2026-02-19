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
				bills: true,
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
 * Mark order as delivered (employees and admins only)
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
		});

		if (!order) {
			return errorResponse("Order not found", 404);
		}

		if (order.status !== "PENDING") {
			return errorResponse("Order is not pending", 400);
		}

		const updatedOrder = await prisma.order.update({
			where: { id },
			data: {
				status: "DELIVERED",
				deliveredAt: new Date(),
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

		// Log this action
		await createAuditLog(
			authRequest.user.id,
			"ORDER_MARKED_DELIVERED",
			"orders",
			id,
			{
				quantity: validatedData.quantityDelivered,
				previousStatus: order.status,
				timestamp: new Date().toISOString(),
			},
		);

		return successResponse({
			message: "Order marked as delivered",
			order: updatedOrder,
		});
	} catch (error: any) {
		console.error("Order delivery error:", error);
		if (error.name === "ZodError") {
			return errorResponse("Validation error", 400, error.errors);
		}
		return errorResponse("Failed to update order", 500);
	}
}
