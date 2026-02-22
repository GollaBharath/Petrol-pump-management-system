import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticate, successResponse, errorResponse } from "@/lib/auth";

/**
 * GET /api/bills/reports/analytics
 * Get payment analytics and reports (admin only)
 */
export async function GET(request: NextRequest) {
	try {
		const authResult = await authenticate(request);
		if (authResult instanceof NextResponse) return authResult;

		const authRequest = authResult as any;
		if (authRequest.user?.role !== "ADMIN") {
			return errorResponse("Admin access required", 403);
		}

		const { searchParams } = new URL(request.url);
		const startDate = searchParams.get("startDate");
		const endDate = searchParams.get("endDate");
		const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 365);
		const offset = parseInt(searchParams.get("offset") || "0");

		const where: any = {};
		if (startDate || endDate) {
			where.paymentDate = {};
			if (startDate) where.paymentDate.gte = new Date(startDate);
			if (endDate) where.paymentDate.lte = new Date(endDate);
		}

		const [payments, total] = await Promise.all([
			prisma.payment.findMany({
				where,
				include: {
					customerProfile: {
						include: {
							user: {
								select: { id: true, fullName: true, email: true },
							},
						},
					},
				},
				orderBy: { paymentDate: "desc" },
				take: limit,
				skip: offset,
			}),
			prisma.payment.count({ where }),
		]);

		// Aggregate stats (all time, ignoring pagination filter for totals)
		const agg = await prisma.payment.aggregate({
			_sum: { amount: true },
			_count: { id: true },
			_avg: { amount: true },
		});

		// Total outstanding (customers who owe money)
		const outstandingAgg = await prisma.customerProfile.aggregate({
			where: { currentBalance: { lt: 0 } },
			_sum: { currentBalance: true },
		});

		// Breakdown by payment method
		const byMethod = await prisma.payment.groupBy({
			by: ["paymentMethod"],
			_sum: { amount: true },
			_count: { id: true },
			orderBy: { _sum: { amount: "desc" } },
		});

		return successResponse({
			payments,
			pagination: {
				total,
				limit,
				offset,
				page: Math.floor(offset / limit) + 1,
				pages: Math.ceil(total / limit),
			},
			analytics: {
				totalPaymentsCollected: agg._sum.amount ?? 0,
				totalPaymentCount: agg._count.id,
				averagePaymentAmount: agg._avg.amount ?? 0,
				totalOutstanding: Math.abs(outstandingAgg._sum.currentBalance ?? 0),
				byPaymentMethod: byMethod.map((m) => ({
					method: m.paymentMethod,
					total: m._sum.amount ?? 0,
					count: m._count.id,
				})),
			},
		});
	} catch (error: any) {
		console.error("Payment analytics error:", error);
		return errorResponse("Failed to fetch payment analytics", 500);
	}
}
