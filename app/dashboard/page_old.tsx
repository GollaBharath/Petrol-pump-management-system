import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import DashboardClient from "./dashboard-client";

export const metadata = {
	title: "Admin Dashboard | Petrol Pump Management",
	description: "Manage orders, prices, and cash advances",
};

export default async function DashboardPage() {
	const session = await getServerSession(authOptions);

	if (!session) {
		redirect("/api/auth/signin");
	}

	if (session.user.role !== "ADMIN") {
		redirect("/");
	}

	return <DashboardClient />;
}
