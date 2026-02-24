import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticate, requireRole, successResponse, errorResponse } from "@/lib/auth";

/**
 * GET /api/orders/next-indent
 * Fetch the customer's next available indent number.
 */
export async function GET(request: NextRequest) {
	try {
		const authResult = await authenticate(request);
		if (authResult instanceof Response) return authResult;

		const authRequest = authResult as any;
		const roleCheck = requireRole("CUSTOMER")(authRequest);
		if (roleCheck) return roleCheck;

		const customerId = authRequest.user.id;

		const profile = await prisma.customerProfile.findUnique({
			where: { userId: customerId },
			select: { currentIndent: true, indentEnd: true },
		});

		if (!profile || profile.currentIndent == null || profile.indentEnd == null) {
			return successResponse({
				nextIndent: null,
				isExhausted: false,
				isConfigured: false,
			});
		}

		return successResponse({
			nextIndent: profile.currentIndent,
			isExhausted: profile.currentIndent > profile.indentEnd,
			isConfigured: true,
		});
	} catch (error: any) {
		console.error("Fetch next indent error:", error);
		return errorResponse("Failed to fetch next indent", 500);
	}
}
