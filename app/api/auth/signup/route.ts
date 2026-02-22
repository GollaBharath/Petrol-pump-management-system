import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { SignupSchema } from "@/lib/validation";
import { successResponse, errorResponse } from "@/lib/auth";

const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * POST /api/auth/signup
 * Register a new user
 */
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const validatedData = SignupSchema.parse(body);

		// Create user in Supabase Auth
		const { data: authData, error: authError } =
			await supabase.auth.admin.createUser({
				email: validatedData.email,
				password: validatedData.password,
				email_confirm: true, // Auto-confirm email for development
			});

		if (authError || !authData.user) {
			return errorResponse("Failed to create user: " + authError?.message, 400);
		}

		// Create user in database
		const user = await prisma.user.create({
			data: {
				id: authData.user.id,
				email: validatedData.email,
				fullName: validatedData.fullName,
				phone: validatedData.phone,
				role: validatedData.role,
			},
		});

		return successResponse(
			{
				message: "User created successfully",
				user: {
					id: user.id,
					email: user.email,
					fullName: user.fullName,
					role: user.role,
				},
			},
			201,
		);
	} catch (error: any) {
		console.error("Signup error:", error);
		if (error.name === "ZodError") {
			return errorResponse("Validation error", 400, error.errors);
		}
		return errorResponse("Internal server error", 500);
	}
}
