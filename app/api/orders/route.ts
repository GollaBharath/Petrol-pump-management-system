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

		const customerId = authRequest.user.id;

		// We need to fetch the customer profile to verify indent availability and update it atomically.
		const orderResult = await prisma.$transaction(async (tx) => {
			const profile = await tx.customerProfile.findUnique({
				where: { userId: customerId },
				select: { id: true, indentStart: true, indentEnd: true, currentIndent: true },
			});

			// If no profile or no indent configured, we might either block them or let them order without an indent.
			// Given the requirements, indent is expected. But for safety, if not configured, we'll just not assign one, or we can enforce it.
			// Let's enforce it as requested: "they will get 1 indent number from this range"
			if (!profile || profile.currentIndent == null || profile.indentEnd == null) {
				throw new Error("INDENT_NOT_CONFIGURED");
			}

			if (profile.currentIndent > profile.indentEnd) {
				throw new Error("INDENT_EXHAUSTED");
			}

			const assignedIndent = profile.currentIndent;

			// Increment the indent for the next order
			await tx.customerProfile.update({
				where: { id: profile.id },
				data: { currentIndent: assignedIndent + 1 },
			});

			// Create the order
			const order = await tx.order.create({
				data: {
					customerId: customerId,
					vehicleNumber: validatedData.vehicleNumber,
					indentNumber: assignedIndent,
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

			return order;
		});

		return successResponse(
			{
				message: "Order created successfully",
				order: orderResult,
			},
			201,
		);
	} catch (error: any) {
		console.error("Order creation error:", error);
		if (error.message === "INDENT_NOT_CONFIGURED") {
			return errorResponse("Customer indent range not configured by admin.", 400);
		}
		if (error.message === "INDENT_EXHAUSTED") {
			return errorResponse("Customer indent range exhausted. Please contact admin.", 400);
		}
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
