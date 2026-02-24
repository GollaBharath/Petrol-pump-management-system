import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticate, requireRole, successResponse, errorResponse } from "@/lib/auth";
import { SetIndentSchema } from "@/lib/validation";

/**
 * POST /api/admin/users/[id]/indent
 * Update a customer's indent settings
 */
export async function POST(
	request: NextRequest,
	{ params }: { params: { id: string } },
) {
	try {
		const authResult = await authenticate(request);
		if (authResult instanceof Response) return authResult;

		const authRequest = authResult as any;
		const roleCheck = requireRole("ADMIN")(authRequest);
		if (roleCheck) return roleCheck;

		const userId = params.id;
		const body = await request.json();
		const validatedData = SetIndentSchema.parse(body);

		const user = await prisma.user.findUnique({
			where: { id: userId },
			include: { customerProfile: true },
		});

		if (!user) {
			return errorResponse("User not found", 404);
		}
		if (user.role !== "CUSTOMER") {
			return errorResponse("Indents can only be assigned to customers", 400);
		}

		if (!user.customerProfile) {
			// Profile should exist, but create if missing
			await prisma.customerProfile.create({
				data: {
					userId: userId,
					indentStart: validatedData.indentStart,
					indentEnd: validatedData.indentEnd,
					currentIndent: validatedData.indentStart,
				},
			});
		} else {
			await prisma.customerProfile.update({
				where: { id: user.customerProfile.id },
				data: {
					indentStart: validatedData.indentStart,
					indentEnd: validatedData.indentEnd,
					currentIndent: validatedData.indentStart, // Reset current indent when new range is given
				},
			});
		}

		return successResponse({ message: "Indent configuration updated successfully" });
	} catch (error: any) {
		console.error("Update indent error:", error);
		if (error.name === "ZodError") {
			return errorResponse("Validation error", 400, error.errors);
		}
		return errorResponse("Failed to update indent setting", 500);
	}
}
