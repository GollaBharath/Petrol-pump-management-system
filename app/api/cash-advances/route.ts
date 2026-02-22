import { NextResponse } from "next/server";

const GONE_MESSAGE = {
	error:
		"Cash advances have been removed from this system. Orders now track a 'cash' field directly on the order.",
};

/** @deprecated Cash advances have been removed */
export async function GET() {
	return NextResponse.json(GONE_MESSAGE, { status: 410 });
}

/** @deprecated Cash advances have been removed */
export async function POST() {
	return NextResponse.json(GONE_MESSAGE, { status: 410 });
}
