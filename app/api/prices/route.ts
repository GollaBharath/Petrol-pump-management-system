import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
	authenticate,
	requireRole,
	successResponse,
	errorResponse,
} from "@/lib/auth";
import { SetFuelPriceSchema } from "@/lib/validation";
import { createAuditLog } from "@/lib/db-utils";

/**
 * POST /api/prices
 * Set fuel price (admins only)
 */
export async function POST(request: NextRequest) {
	try {
		const authResult = await authenticate(request);
		if (authResult instanceof NextResponse) return authResult;

		const authRequest = authResult as any;
		const roleCheck = requireRole("ADMIN")(authRequest);
		if (roleCheck) return roleCheck;

		const body = await request.json();
		const validatedData = SetFuelPriceSchema.parse(body);

		const date = validatedData.date ? new Date(validatedData.date) : new Date();
		date.setHours(0, 0, 0, 0);

		// Check if price already exists for this date
		const existingPrice = await prisma.fuelPrice.findFirst({
			where: {
				fuelType: validatedData.fuelType,
				date: {
					equals: date,
				},
			},
		});

		let price;
		if (existingPrice) {
			price = await prisma.fuelPrice.update({
				where: { id: existingPrice.id },
				data: {
					pricePerLiter: validatedData.pricePerLiter,
				},
			});
		} else {
			price = await prisma.fuelPrice.create({
				data: {
					fuelType: validatedData.fuelType,
					pricePerLiter: validatedData.pricePerLiter,
					date,
					createdByAdminId: authRequest.user.id,
				},
			});
		}

		// Log this action
		await createAuditLog(
			authRequest.user.id,
			existingPrice ? "PRICE_UPDATE" : "PRICE_CREATE",
			"fuel_prices",
			price.id,
			{
				fuelType: validatedData.fuelType,
				pricePerLiter: validatedData.pricePerLiter,
				date: date.toISOString(),
				timestamp: new Date().toISOString(),
			},
		);

		return successResponse(
			{
				message: existingPrice ? "Price updated" : "Price created",
				price,
			},
			existingPrice ? 200 : 201,
		);
	} catch (error: any) {
		console.error("Price setting error:", error);
		if (error.name === "ZodError") {
			return errorResponse("Validation error", 400, error.errors);
		}
		return errorResponse("Failed to set price", 500);
	}
}

/**
 * GET /api/prices/latest
 * Get latest prices for all fuel types (admin only)
 */
export async function GET(request: NextRequest) {
	try {
		const authResult = await authenticate(request);
		if (authResult instanceof NextResponse) return authResult;
		const authRequest = authResult as any;
		if (authRequest.user?.role !== "ADMIN") {
			return errorResponse("Admin access required", 403);
		}

		const prices = await prisma.fuelPrice.groupBy({
			by: ["fuelType"],
			_max: {
				date: true,
			},
		});

		const latestPrices = await Promise.all(
			prices.map(async (group) => {
				if (!group._max.date) return null;
				const price = await prisma.fuelPrice.findFirst({
					where: {
						fuelType: group.fuelType,
						date: group._max.date,
					},
				});
				return price;
			}),
		);

		return successResponse({
			prices: latestPrices.filter((p) => p !== null),
		});
	} catch (error: any) {
		console.error("Price fetch error:", error);
		return errorResponse("Failed to fetch prices", 500);
	}
}
