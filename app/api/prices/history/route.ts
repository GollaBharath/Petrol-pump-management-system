import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/auth";

/**
 * GET /api/prices/history
 * Get price history with optional date range filter
 */
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const fuelType = searchParams.get("fuelType");
		const limit = Math.min(parseInt(searchParams.get("limit") || "30"), 365);
		const offset = parseInt(searchParams.get("offset") || "0");

		const where: any = {};
		if (fuelType) {
			where.fuelType = fuelType;
		}

		const [prices, total] = await Promise.all([
			prisma.fuelPrice.findMany({
				where,
				orderBy: { date: "desc" },
				take: limit,
				skip: offset,
			}),
			prisma.fuelPrice.count({ where }),
		]);

		return successResponse({
			prices,
			pagination: {
				total,
				limit,
				offset,
				page: Math.floor(offset / limit) + 1,
				pages: Math.ceil(total / limit),
			},
		});
	} catch (error: any) {
		console.error("Price history fetch error:", error);
		return errorResponse("Failed to fetch price history", 500);
	}
}
