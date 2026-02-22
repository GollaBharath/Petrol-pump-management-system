import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import {
	setDailyPrice,
	updateDailyPrice,
	getPriceUpdateStatus,
} from "@/lib/db-utils";
import { z } from "zod";

const setPriceSchema = z.object({
	fuelType: z.enum(["PETROL", "DIESEL"]),
	pricePerLiter: z.number().positive(),
	date: z.string().datetime().optional(),
});

const updatePriceSchema = z.object({
	priceId: z.string().min(1),
	newPricePerLiter: z.number().positive(),
});

export async function POST(request: NextRequest) {
	try {
		const authResult = await authenticate(request);
		if (authResult instanceof NextResponse) return authResult;
		const authRequest = authResult as any;
		if (authRequest.user?.role !== "ADMIN") {
			return NextResponse.json(
				{ error: "Only admins can set fuel prices" },
				{ status: 403 },
			);
		}
		const user = authRequest.user;

		// Validate request body
		const body = await request.json();
		const data = setPriceSchema.parse(body);

		// Set daily price
		const price = await setDailyPrice(
			data.fuelType as any,
			data.pricePerLiter,
			user.id,
			data.date ? new Date(data.date) : undefined,
		);

		return NextResponse.json(
			{
				message: "Price set successfully",
				price,
			},
			{ status: 201 },
		);
	} catch (error: any) {
		console.error("Set price error:", error);
		return NextResponse.json(
			{
				error: error.message || "Failed to set fuel price",
			},
			{ status: 400 },
		);
	}
}

export async function PUT(request: NextRequest) {
	try {
		const authResult = await authenticate(request);
		if (authResult instanceof NextResponse) return authResult;
		const authRequest = authResult as any;
		if (authRequest.user?.role !== "ADMIN") {
			return NextResponse.json(
				{ error: "Only admins can update fuel prices" },
				{ status: 403 },
			);
		}
		const user = authRequest.user;

		// Validate request body
		const body = await request.json();
		const data = updatePriceSchema.parse(body);

		// Update price
		const updated = await updateDailyPrice(
			data.priceId,
			data.newPricePerLiter,
			user.id,
		);

		return NextResponse.json(
			{
				message: "Price updated successfully",
				price: updated,
			},
			{ status: 200 },
		);
	} catch (error: any) {
		console.error("Update price error:", error);
		return NextResponse.json(
			{
				error: error.message || "Failed to update fuel price",
			},
			{ status: 400 },
		);
	}
}

export async function GET(request: NextRequest) {
	try {
		const authResult = await authenticate(request);
		if (authResult instanceof NextResponse) return authResult;
		const authRequest = authResult as any;
		if (authRequest.user?.role !== "ADMIN") {
			return NextResponse.json(
				{ error: "Only admins can view price status" },
				{ status: 403 },
			);
		}

		// Get price update status
		const status = await getPriceUpdateStatus();

		return NextResponse.json(
			{
				status,
				timestamp: new Date().toISOString(),
			},
			{ status: 200 },
		);
	} catch (error: any) {
		console.error("Get status error:", error);
		return NextResponse.json(
			{
				error: error.message || "Failed to fetch price status",
			},
			{ status: 500 },
		);
	}
}
