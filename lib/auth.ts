import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export interface AuthenticatedRequest extends NextRequest {
	user?: {
		id: string;
		email: string;
		role: "CUSTOMER" | "EMPLOYEE" | "ADMIN";
	};
}

/**
 * Middleware to authenticate API requests using Supabase JWT
 */
export async function authenticate(
	request: NextRequest,
): Promise<AuthenticatedRequest | NextResponse> {
	const authHeader = request.headers.get("authorization");

	if (!authHeader?.startsWith("Bearer ")) {
		return NextResponse.json(
			{ error: "Missing or invalid authorization header" },
			{ status: 401 },
		);
	}

	const token = authHeader.slice(7);

	try {
		// Verify the JWT token with Supabase
		const { data, error } = await supabase.auth.getUser(token);

		if (error || !data.user) {
			return NextResponse.json(
				{ error: "Invalid or expired token" },
				{ status: 401 },
			);
		}

		// Get user details including role from Prisma database
		const userData = await prisma.user.findUnique({
			where: { id: data.user.id },
			select: { id: true, email: true, role: true },
		});

		if (!userData) {
			return NextResponse.json({ error: "User not found" }, { status: 401 });
		}

		// Attach user to request
		(request as AuthenticatedRequest).user = {
			id: userData.id,
			email: userData.email,
			role: userData.role,
		};

		return request as AuthenticatedRequest;
	} catch (error) {
		console.error("Authentication error:", error);
		return NextResponse.json(
			{ error: "Authentication failed" },
			{ status: 401 },
		);
	}
}

/**
 * Middleware to check if user has required role
 */
export function requireRole(...roles: string[]) {
	return (request: AuthenticatedRequest) => {
		if (!request.user) {
			return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
		}

		if (!roles.includes(request.user.role)) {
			return NextResponse.json(
				{ error: "Insufficient permissions" },
				{ status: 403 },
			);
		}

		return null;
	};
}

/**
 * Error response handler
 */
export function errorResponse(
	message: string,
	status: number = 400,
	details?: any,
) {
	return NextResponse.json(
		{
			error: message,
			...(process.env.NODE_ENV === "development" && details && { details }),
		},
		{ status },
	);
}

/**
 * Success response handler
 */
export function successResponse(data: any, status: number = 200) {
	return NextResponse.json(data, { status });
}
