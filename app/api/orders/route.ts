import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
	authenticate,
	requireRole,
	successResponse,
	errorResponse,
} from "@/lib/auth";
import { CreateOrderSchema } from "@/lib/validation";

/**
 * POST /api/orders
 * Create a new order (customers only)
 */
export async function POST(request: NextRequest) {
	try {
		const authResult = await authenticate(request);
		if (authResult instanceof NextResponse) return authResult;

		const authRequest = authResult as any;
		const roleCheck = requireRole("CUSTOMER")(authRequest);
		if (roleCheck) return roleCheck;

		const body = await request.json();
		const validatedData = CreateOrderSchema.parse(body);

		const order = await prisma.order.create({
			data: {
				customerId: authRequest.user.id,
				vehicleNumber: validatedData.vehicleNumber,
				fuelType: validatedData.fuelType,
				amountRequested: validatedData.amountRequested,
				quantityRequested: validatedData.quantityRequested,
				cash: validatedData.cash,
				status: "PENDING",
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

		return successResponse(
			{
				message: "Order created successfully",
				order,
			},
			201,
		);
	} catch (error: any) {
		console.error("Order creation error:", error);
		if (error.name === "ZodError") {
			return errorResponse("Validation error", 400, error.errors);
		}
		return errorResponse("Failed to create order", 500);
	}
}

/**
 * GET /api/orders
 * List customer's orders
 */
export async function GET(request: NextRequest) {
	try {
		const authResult = await authenticate(request);
		if (authResult instanceof NextResponse) return authResult;

		const authRequest = authResult as any;

		// Get pagination params
		const { searchParams } = new URL(request.url);
		const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
		const offset = parseInt(searchParams.get("offset") || "0");

		// Customers see only their orders, employees and admins see all
		let whereClause: any = {};
		if (authRequest.user.role === "CUSTOMER") {
			whereClause = { customerId: authRequest.user.id };
		}

		const [orders, total] = await Promise.all([
			prisma.order.findMany({
				where: whereClause,
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
				orderBy: { createdAt: "desc" },
				take: limit,
				skip: offset,
			}),
			prisma.order.count({ where: whereClause }),
		]);

		return successResponse({
			orders,
			pagination: {
				total,
				limit,
				offset,
				page: Math.floor(offset / limit) + 1,
				pages: Math.ceil(total / limit),
			},
		});
	} catch (error: any) {
		console.error("Order fetch error:", error);
		return errorResponse("Failed to fetch orders", 500);
	}
}
