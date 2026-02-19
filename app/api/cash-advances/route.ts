import { NextRequest, NextResponse } from "next/server";
import { validateRequest, validateSchema } from "@/lib/validation";
import { authenticate } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { disburseCashAdvance } from "@/lib/db-utils";
import { z } from "zod";

const cashAdvanceSchema = z.object({
	orderId: z.string().min(1),
	employeeId: z.string().min(1),
	amount: z.number().positive(),
	description: z.string().optional(),
});

export async function POST(request: NextRequest) {
	try {
		// Authenticate as admin or manager
		const user = await authenticate(request);
		if (!user || user.role !== "ADMIN") {
			return NextResponse.json(
				{ error: "Only admins can disburse cash advances" },
				{ status: 403 },
			);
		}

		// Validate request body
		const body = await request.json();
		const data = validateSchema(cashAdvanceSchema, body);

		// Disburse cash advance
		const transaction = await disburseCashAdvance(
			data.orderId,
			data.employeeId,
			data.amount,
			data.description,
		);

		return NextResponse.json(
			{
				message: "Cash advance disbursed successfully",
				transaction,
			},
			{ status: 201 },
		);
	} catch (error: any) {
		console.error("Cash advance error:", error);
		return NextResponse.json(
			{
				error: error.message || "Failed to disburse cash advance",
			},
			{ status: 400 },
		);
	}
}

export async function GET(request: NextRequest) {
	try {
		// Authenticate
		const user = await authenticate(request);
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Get employee's cash advance transactions
		const employeeId = request.nextUrl.searchParams.get("employeeId");

		if (employeeId && user.role !== "ADMIN" && user.id !== employeeId) {
			return NextResponse.json(
				{ error: "Cannot view other users' transactions" },
				{ status: 403 },
			);
		}

		const transactions = await prisma.cashAdvanceTransaction.findMany({
			where: employeeId ? { employeeId } : undefined,
			include: {
				employee: {
					select: {
						id: true,
						fullName: true,
						email: true,
					},
				},
			},
			orderBy: {
				createdAt: "desc",
			},
			take: 100,
		});

		return NextResponse.json({ transactions }, { status: 200 });
	} catch (error: any) {
		console.error("Get cash advances error:", error);
		return NextResponse.json(
			{
				error: error.message || "Failed to fetch cash advances",
			},
			{ status: 500 },
		);
	}
}
