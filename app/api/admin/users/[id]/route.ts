import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { authenticate } from "@/lib/auth";
import { z } from "zod";

const supabaseAdmin = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const UpdateUserSchema = z.object({
	fullName: z.string().min(2).optional(),
	phone: z.string().optional().nullable(),
	role: z.enum(["CUSTOMER", "EMPLOYEE", "ADMIN"]).optional(),
	password: z.string().min(8).optional(),
});

/**
 * GET /api/admin/users/[id]
 * Get a single user's details.
 */
export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } },
) {
	try {
		const authResult = await authenticate(request);
		if (authResult instanceof NextResponse) return authResult;

		const authRequest = authResult as any;
		if (authRequest.user?.role !== "ADMIN") {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const user = await prisma.user.findUnique({
			where: { id: params.id },
			include: {
				_count: {
					select: { orders: true, cashAdvanceTransactions: true },
				},
				orders: {
					orderBy: { createdAt: "desc" },
					take: 5,
					select: {
						id: true,
						status: true,
						fuelType: true,
						createdAt: true,
					},
				},
			},
		});

		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		return NextResponse.json({ user });
	} catch (error: any) {
		console.error("Get user error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch user" },
			{ status: 500 },
		);
	}
}

/**
 * PATCH /api/admin/users/[id]
 * Update a user's profile or role. Admin only.
 */
export async function PATCH(
	request: NextRequest,
	{ params }: { params: { id: string } },
) {
	try {
		const authResult = await authenticate(request);
		if (authResult instanceof NextResponse) return authResult;

		const authRequest = authResult as any;
		if (authRequest.user?.role !== "ADMIN") {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const body = await request.json();
		const data = UpdateUserSchema.parse(body);

		// Update password in Supabase if provided
		if (data.password) {
			const { error } = await supabaseAdmin.auth.admin.updateUserById(
				params.id,
				{ password: data.password },
			);
			if (error) {
				return NextResponse.json(
					{ error: "Failed to update password: " + error.message },
					{ status: 400 },
				);
			}
		}

		// Update profile in Prisma
		const updateData: any = {};
		if (data.fullName !== undefined) updateData.fullName = data.fullName;
		if (data.phone !== undefined) updateData.phone = data.phone;
		if (data.role !== undefined) updateData.role = data.role;

		const user = await prisma.user.update({
			where: { id: params.id },
			data: updateData,
			select: {
				id: true,
				email: true,
				fullName: true,
				phone: true,
				role: true,
				updatedAt: true,
			},
		});

		return NextResponse.json({
			message: "User updated successfully",
			user,
		});
	} catch (error: any) {
		console.error("Update user error:", error);
		if (error.code === "P2025") {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}
		if (error.name === "ZodError") {
			return NextResponse.json(
				{ error: "Validation error", details: error.errors },
				{ status: 400 },
			);
		}
		return NextResponse.json(
			{ error: error.message || "Failed to update user" },
			{ status: 500 },
		);
	}
}

/**
 * DELETE /api/admin/users/[id]
 * Delete a user from both Supabase Auth and Prisma. Admin only.
 */
export async function DELETE(
	request: NextRequest,
	{ params }: { params: { id: string } },
) {
	try {
		const authResult = await authenticate(request);
		if (authResult instanceof NextResponse) return authResult;

		const authRequest = authResult as any;
		if (authRequest.user?.role !== "ADMIN") {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		// Prevent self-deletion
		if (authRequest.user.id === params.id) {
			return NextResponse.json(
				{ error: "Cannot delete your own account" },
				{ status: 400 },
			);
		}

		// Delete from Prisma (cascades related records per schema)
		await prisma.user.delete({ where: { id: params.id } });

		// Delete from Supabase Auth
		await supabaseAdmin.auth.admin.deleteUser(params.id);

		return NextResponse.json({ message: "User deleted successfully" });
	} catch (error: any) {
		console.error("Delete user error:", error);
		if (error.code === "P2025") {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}
		return NextResponse.json(
			{ error: error.message || "Failed to delete user" },
			{ status: 500 },
		);
	}
}
