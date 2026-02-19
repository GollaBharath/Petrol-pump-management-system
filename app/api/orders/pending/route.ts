import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
	authenticate,
	successResponse,
	errorResponse,
	requireRole,
} from "@/lib/auth";
import { MarkOrderDeliveredSchema } from "@/lib/validation";

/**
 * GET /api/orders/pending
 * Get pending orders (employees and admins only)
 */
export async function GET(request: NextRequest) {
	try {
		const authResult = await authenticate(request);
		if (authResult instanceof NextResponse) return authResult;

		const authRequest = authResult as any;
		const roleCheck = requireRole("EMPLOYEE", "ADMIN")(authRequest);
		if (roleCheck) return roleCheck;

		const orders = await prisma.order.findMany({
			where: { status: "PENDING" },
			include: {
				customer: {
					select: {
						id: true,
						fullName: true,
						email: true,
						phone: true,
					},
				},
			},
			orderBy: { createdAt: "asc" },
		});

		return successResponse({
			orders,
			count: orders.length,
		});
	} catch (error: any) {
		console.error("Pending orders fetch error:", error);
		return errorResponse("Failed to fetch pending orders", 500);
	}
}
