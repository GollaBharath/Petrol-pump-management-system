import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import { markBillAsPaid } from "@/lib/billing-utils";
import { z } from "zod";

const markPaidSchema = z.object({
	paymentMethod: z
		.enum(["CASH", "UPI", "CHEQUE", "BANK_TRANSFER"])
		.default("CASH"),
});

/**
 * PATCH /api/bills/[id]/pay
 * Mark a bill as paid
 * Admin only
 */
export async function PATCH(
	request: NextRequest,
	{ params }: { params: { id: string } },
) {
	try {
		const user = await authenticate(request);

		if (!user || user.role !== "ADMIN") {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const billId = params.id;
		const body = await request.json();
		const { paymentMethod } = markPaidSchema.parse(body);

		const bill = await markBillAsPaid(billId, user.id, paymentMethod);

		return NextResponse.json(
			{
				success: true,
				message: "Bill marked as paid",
				bill,
			},
			{ status: 200 },
		);
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{
					error: "Validation error",
					details: error.errors,
				},
				{ status: 400 },
			);
		}

		const errorMessage =
			error instanceof Error ? error.message : "Failed to mark bill as paid";
		return NextResponse.json({ error: errorMessage }, { status: 400 });
	}
}
