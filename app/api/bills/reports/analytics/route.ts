import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import { supabase } from "@/lib/supabase-client";
import { z } from "zod";

const reportQuerySchema = z.object({
	startDate: z.string().datetime().optional(),
	endDate: z.string().datetime().optional(),
	status: z.enum(["PENDING", "PAID", "OVERDUE"]).optional(),
	limit: z.string().transform(Number).optional(),
	offset: z.string().transform(Number).optional(),
});

/**
 * GET /api/bills/reports/analytics
 * Get billing analytics and reports
 * Admin only
 */
export async function GET(request: NextRequest) {
	try {
		const user = await authenticate(request);

		if (!user || user.role !== "ADMIN") {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const searchParams = request.nextUrl.searchParams;
		const query = reportQuerySchema.parse({
			startDate: searchParams.get("startDate") || undefined,
			endDate: searchParams.get("endDate") || undefined,
			status: searchParams.get("status") || undefined,
			limit: searchParams.get("limit") || "50",
			offset: searchParams.get("offset") || "0",
		});

		let billsQuery = supabase.from("bills").select("*", { count: "exact" });

		if (query.startDate) {
			billsQuery = billsQuery.gte("createdAt", query.startDate);
		}

		if (query.endDate) {
			billsQuery = billsQuery.lte("createdAt", query.endDate);
		}

		if (query.status) {
			billsQuery = billsQuery.eq("status", query.status);
		}

		billsQuery = billsQuery
			.order("createdAt", { ascending: false })
			.range(query.offset || 0, (query.offset || 0) + (query.limit || 50) - 1);

		const { data: bills, count, error } = await billsQuery;

		if (error) {
			throw error;
		}

		// Calculate statistics
		let totalAmount = 0;
		let paidAmount = 0;
		let overdueAmount = 0;

		const allBillsQuery = supabase.from("bills").select("*");

		const { data: allBills } = await allBillsQuery;

		if (allBills) {
			allBills.forEach((bill: any) => {
				totalAmount += bill.totalAmount;
				if (bill.status === "PAID") {
					paidAmount += bill.totalAmount;
				}
				if (bill.status === "OVERDUE") {
					overdueAmount += bill.totalAmount;
				}
			});
		}

		return NextResponse.json(
			{
				success: true,
				data: {
					bills,
					pagination: {
						total: count,
						limit: query.limit,
						offset: query.offset,
					},
					analytics: {
						totalAmount,
						paidAmount,
						pendingAmount: totalAmount - paidAmount - overdueAmount,
						overdueAmount,
						paymentRate: totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0,
					},
				},
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
			error instanceof Error ? error.message : "Failed to fetch bill reports";
		return NextResponse.json({ error: errorMessage }, { status: 400 });
	}
}
