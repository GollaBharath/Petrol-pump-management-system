import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import { getCashAdvanceReport, getPendingCashAdvances } from "@/lib/db-utils";

export async function GET(request: NextRequest) {
	try {
		// Authenticate as admin
		const user = await authenticate(request);
		if (!user || user.role !== "ADMIN") {
			return NextResponse.json(
				{ error: "Only admins can view cash advance reports" },
				{ status: 403 },
			);
		}

		// Get query parameters
		const searchParams = request.nextUrl.searchParams;
		const reportType = searchParams.get("type") || "pending"; // pending or range
		const startDate = searchParams.get("startDate");
		const endDate = searchParams.get("endDate");

		if (reportType === "pending") {
			// Get all pending (unreconciled) cash advances
			const pending = await getPendingCashAdvances(500);
			return NextResponse.json(pending, { status: 200 });
		} else if (reportType === "range" && startDate && endDate) {
			// Get report for a date range
			const report = await getCashAdvanceReport(
				new Date(startDate),
				new Date(endDate),
			);
			return NextResponse.json(report, { status: 200 });
		} else {
			return NextResponse.json(
				{
					error: "Invalid report type or missing date parameters",
				},
				{ status: 400 },
			);
		}
	} catch (error: any) {
		console.error("Report error:", error);
		return NextResponse.json(
			{
				error: error.message || "Failed to generate cash advance report",
			},
			{ status: 500 },
		);
	}
}
