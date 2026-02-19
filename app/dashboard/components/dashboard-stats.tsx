import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Package, DollarSign, Users } from "lucide-react";

interface StatCardProps {
	title: string;
	value: string;
	trend?: string;
	trendUp?: boolean;
	icon: React.ReactNode;
}

function StatCard({ title, value, trend, trendUp, icon }: StatCardProps) {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="text-sm font-medium">{title}</CardTitle>
				{icon}
			</CardHeader>
			<CardContent>
				<div className="text-2xl font-bold">{value}</div>
				{trend && (
					<p
						className={`text-xs mt-2 ${trendUp ? "text-green-600" : "text-red-600"}`}>
						{trendUp ? "↑" : "↓"} {trend}
					</p>
				)}
			</CardContent>
		</Card>
	);
}

export default function DashboardStats() {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
			<StatCard
				title="Total Orders"
				value="342"
				trend="12% from last week"
				trendUp={true}
				icon={<Package className="h-4 w-4 text-blue-600" />}
			/>
			<StatCard
				title="Pending Orders"
				value="23"
				trend="2 since this morning"
				trendUp={false}
				icon={<TrendingUp className="h-4 w-4 text-orange-600" />}
			/>
			<StatCard
				title="Total Revenue"
				value="₹4,24,800"
				trend="8% from last month"
				trendUp={true}
				icon={<DollarSign className="h-4 w-4 text-green-600" />}
			/>
			<StatCard
				title="Active Employees"
				value="12"
				trend="All online"
				trendUp={true}
				icon={<Users className="h-4 w-4 text-purple-600" />}
			/>
		</div>
	);
}
