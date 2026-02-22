import { NextResponse } from "next/server";

/** @deprecated Cash advances have been removed */
export async function GET() {
	return NextResponse.json(
		{ error: "Cash advances have been removed from this system." },
		{ status: 410 },
	);
}
