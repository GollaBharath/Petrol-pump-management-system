import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { LoginSchema } from "@/lib/validation";
import { successResponse, errorResponse } from "@/lib/auth";

const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * POST /api/auth/login
 * Login user and return session
 */
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const validatedData = LoginSchema.parse(body);

		// Authenticate with Supabase
		const { data, error } = await supabase.auth.signInWithPassword({
			email: validatedData.email,
			password: validatedData.password,
		});

		if (error || !data.session) {
			return errorResponse("Invalid email or password", 401);
		}

		// Get user profile from database
		const userProfile = await prisma.user.findUnique({
			where: { id: data.user.id },
			select: {
				id: true,
				email: true,
				fullName: true,
				role: true,
				phone: true,
			},
		});

		if (!userProfile) {
			return errorResponse("User profile not found", 404);
		}

		return successResponse({
			message: "Login successful",
			session: {
				accessToken: data.session.access_token,
				refreshToken: data.session.refresh_token,
				expiresIn: data.session.expires_in,
			},
			user: {
				id: userProfile.id,
				email: userProfile.email,
				fullName: userProfile.fullName,
				role: userProfile.role,
				phone: userProfile.phone,
			},
		});
	} catch (error: any) {
		console.error("Login error:", error);
		if (error.name === "ZodError") {
			return errorResponse("Validation error", 400, error.errors);
		}
		return errorResponse("Internal server error", 500);
	}
}
