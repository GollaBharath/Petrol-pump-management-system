import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { authenticate } from "@/lib/auth";
import { z } from "zod";

const supabaseAdmin = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const CreateUserSchema = z.object({
	email: z.string().email(),
	password: z.string().min(8),
	fullName: z.string().min(2),
	phone: z.string().optional(),
	role: z.enum(["CUSTOMER", "EMPLOYEE", "ADMIN"]).default("CUSTOMER"),
});

/**
 * GET /api/admin/users
 * List all users. Supports ?role=ADMIN|EMPLOYEE|CUSTOMER and ?search=query
 */
export async function GET(request: NextRequest) {
	try {
		const authResult = await authenticate(request);
		if (authResult instanceof NextResponse) return authResult;

		const authRequest = authResult as any;
		if (authRequest.user?.role !== "ADMIN") {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const { searchParams } = new URL(request.url);
		const role = searchParams.get("role") as
			| "CUSTOMER"
			| "EMPLOYEE"
			| "ADMIN"
			| null;
		const search = searchParams.get("search") || "";
		const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
		const offset = parseInt(searchParams.get("offset") || "0");

		const where: any = {};
		if (role) where.role = role;
		if (search) {
			where.OR = [
				{ fullName: { contains: search, mode: "insensitive" } },
				{ email: { contains: search, mode: "insensitive" } },
			];
		}

		const [users, total] = await Promise.all([
			prisma.user.findMany({
				where,
				select: {
					id: true,
					email: true,
					fullName: true,
					phone: true,
					role: true,
					createdAt: true,
					updatedAt: true,
					_count: {
						select: {
							orders: true,
						},
					},
				},
				orderBy: { createdAt: "desc" },
				take: limit,
				skip: offset,
			}),
			prisma.user.count({ where }),
		]);

		return NextResponse.json({
			users,
			pagination: { total, limit, offset },
		});
	} catch (error: any) {
		console.error("List users error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch users" },
			{ status: 500 },
		);
	}
}

/**
 * POST /api/admin/users
 * Create a new user (admin only). Creates in both Supabase Auth and Prisma.
 */
export async function POST(request: NextRequest) {
	try {
		const authResult = await authenticate(request);
		if (authResult instanceof NextResponse) return authResult;

		const authRequest = authResult as any;
		if (authRequest.user?.role !== "ADMIN") {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const body = await request.json();
		const data = CreateUserSchema.parse(body);

		// Create in Supabase Auth
		const { data: authData, error: authError } =
			await supabaseAdmin.auth.admin.createUser({
				email: data.email,
				password: data.password,
				email_confirm: true,
			});

		if (authError || !authData.user) {
			return NextResponse.json(
				{ error: "Failed to create auth user: " + authError?.message },
				{ status: 400 },
			);
		}

		// Create in Prisma
		const user = await prisma.user.create({
			data: {
				id: authData.user.id,
				email: data.email,
				fullName: data.fullName,
				phone: data.phone,
				role: data.role,
			},
		});

		return NextResponse.json(
			{
				message: "User created successfully",
				user: {
					id: user.id,
					email: user.email,
					fullName: user.fullName,
					phone: user.phone,
					role: user.role,
					createdAt: user.createdAt,
				},
			},
			{ status: 201 },
		);
	} catch (error: any) {
		console.error("Create user error:", error);
		if (error.name === "ZodError") {
			return NextResponse.json(
				{ error: "Validation error", details: error.errors },
				{ status: 400 },
			);
		}
		return NextResponse.json(
			{ error: error.message || "Failed to create user" },
			{ status: 500 },
		);
	}
}
