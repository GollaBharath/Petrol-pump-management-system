import { NextResponse } from "next/server";

/**
 * PATCH /api/bills/[id]/pay
 * @deprecated Bills no longer exist. Use POST /api/bills to record a customer payment.
 */
export async function PATCH() {
	return NextResponse.json(
		{
			error:
				"This endpoint has been removed. Use POST /api/bills to record a payment.",
		},
		{ status: 410 },
	);
}
