import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import { validateSchema } from "@/lib/validation";
import { reconcileCashAdvance } from "@/lib/db-utils";
import { z } from "zod";

const reconcileSchema = z.object({
	billId: z.string().min(1),
	amount: z.number().positive(),
});

export async function POST(
	request: NextRequest,
	{ params }: { params: { transactionId: string } },
) {
	try {
		// Authenticate as admin
		const user = await authenticate(request);
		if (!user || user.role !== "ADMIN") {
			return NextResponse.json(
				{ error: "Only admins can reconcile cash advances" },
				{ status: 403 },
			);
		}

		// Validate request body
		const body = await request.json();
		const data = validateSchema(reconcileSchema, body);

		// Reconcile cash advance
		const transaction = await reconcileCashAdvance(
			params.transactionId,
			data.billId,
			data.amount,
		);

		return NextResponse.json(
			{
				message: "Cash advance reconciled successfully",
				transaction,
			},
			{ status: 200 },
		);
	} catch (error: any) {
		console.error("Reconcile error:", error);
		return NextResponse.json(
			{
				error: error.message || "Failed to reconcile cash advance",
			},
			{ status: 400 },
		);
	}
}
