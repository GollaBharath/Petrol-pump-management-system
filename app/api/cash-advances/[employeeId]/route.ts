import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import { getEmployeeCashAdvanceSummary } from "@/lib/db-utils";

export async function GET(
	request: NextRequest,
	{ params }: { params: { employeeId: string } },
) {
	try {
		// Authenticate
		const user = await authenticate(request);
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Only admin or the employee themselves can view their summary
		if (user.role !== "ADMIN" && user.id !== params.employeeId) {
			return NextResponse.json(
				{ error: "Cannot view other users' cash advance summary" },
				{ status: 403 },
			);
		}

		const summary = await getEmployeeCashAdvanceSummary(params.employeeId);

		return NextResponse.json(summary, { status: 200 });
	} catch (error: any) {
		console.error("Get summary error:", error);
		return NextResponse.json(
			{
				error: error.message || "Failed to fetch cash advance summary",
			},
			{ status: 500 },
		);
	}
}
