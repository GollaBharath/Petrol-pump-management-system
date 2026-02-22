import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
	authenticate,
	requireRole,
	successResponse,
	errorResponse,
} from "@/lib/auth";
import { createAuditLog } from "@/lib/db-utils";
import { z } from "zod";

const AddPaymentSchema = z.object({
	amount: z.number().positive("Amount must be positive"),
	paymentMethod: z
		.enum(["CASH", "BANK_TRANSFER", "CHEQUE", "UPI", "OTHER"])
		.optional(),
	paymentMethodNote: z.string().optional(),
	reference: z.string().optional(),
	notes: z.string().optional(),
	paymentDate: z.string().optional(),
});

/**
 * POST /api/customers/[id]/payments
 * Add a payment for a customer (admins only)
 */
export async function POST(
	request: NextRequest,
	{ params }: { params: { id: string } },
) {
	try {
		const authResult = await authenticate(request);
		if (authResult instanceof NextResponse) return authResult;

		const authRequest = authResult as any;
		const roleCheck = requireRole("ADMIN")(authRequest);
		if (roleCheck) return roleCheck;

		const body = await request.json();
		const validatedData = AddPaymentSchema.parse(body);

		// Get customer and their profile
		const customer = await prisma.user.findUnique({
			where: { id: params.id },
			include: {
				customerProfile: true,
			},
		});

		if (!customer) {
			return errorResponse("Customer not found", 404);
		}

		if (customer.role !== "CUSTOMER") {
			return errorResponse("User is not a customer", 400);
		}

		if (!customer.customerProfile) {
			return errorResponse("Customer profile not found", 404);
		}

		// Create payment and update customer profile in a transaction
		const result = await prisma.$transaction(async (tx) => {
			// Create payment
			const payment = await tx.payment.create({
				data: {
					customerProfileId: customer.customerProfile!.id,
					amount: validatedData.amount,
					paymentMethod: validatedData.paymentMethod,
					paymentMethodNote: validatedData.paymentMethodNote,
					reference: validatedData.reference,
					notes: validatedData.notes,
					paymentDate: validatedData.paymentDate
						? new Date(validatedData.paymentDate)
						: new Date(),
				},
			});

			// Update customer profile balance
			const updatedProfile = await tx.customerProfile.update({
				where: { id: customer.customerProfile!.id },
				data: {
					currentBalance: {
						increment: validatedData.amount,
					},
					totalPayments: {
						increment: validatedData.amount,
					},
				},
			});

			return { payment, profile: updatedProfile };
		});

		// Log this action
		await createAuditLog(
			authRequest.user.id,
			"PAYMENT_ADDED",
			"payments",
			result.payment.id,
			{
				customerId: params.id,
				amount: validatedData.amount,
				paymentMethod: validatedData.paymentMethod,
				newBalance: result.profile.currentBalance,
				timestamp: new Date().toISOString(),
			},
		);

		return successResponse({
			message: "Payment added successfully",
			payment: result.payment,
			newBalance: result.profile.currentBalance,
		});
	} catch (error: any) {
		console.error("Error adding payment:", error);
		return errorResponse(error.message || "Failed to add payment", 500);
	}
}

/**
 * GET /api/customers/[id]/payments
 * Get payment history for a customer (admins only)
 */
export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } },
) {
	try {
		const authResult = await authenticate(request);
		if (authResult instanceof NextResponse) return authResult;

		const authRequest = authResult as any;
		const roleCheck = requireRole("ADMIN")(authRequest);
		if (roleCheck) return roleCheck;

		const { searchParams } = new URL(request.url);
		const limit = parseInt(searchParams.get("limit") || "50");
		const offset = parseInt(searchParams.get("offset") || "0");

		// Get customer profile
		const customer = await prisma.user.findUnique({
			where: { id: params.id },
			include: {
				customerProfile: true,
			},
		});

		if (!customer || !customer.customerProfile) {
			return errorResponse("Customer profile not found", 404);
		}

		// Get payments
		const [payments, total] = await Promise.all([
			prisma.payment.findMany({
				where: {
					customerProfileId: customer.customerProfile.id,
				},
				orderBy: { paymentDate: "desc" },
				take: limit,
				skip: offset,
			}),
			prisma.payment.count({
				where: {
					customerProfileId: customer.customerProfile.id,
				},
			}),
		]);

		return successResponse({
			payments,
			pagination: {
				total,
				limit,
				offset,
				hasMore: offset + limit < total,
			},
		});
	} catch (error: any) {
		console.error("Error fetching payments:", error);
		return errorResponse(error.message || "Failed to fetch payments", 500);
	}
}
