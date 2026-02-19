"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	BarChart,
	Bar,
	LineChart,
	Line,
	PieChart,
	Pie,
	Cell,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from "recharts";
import OrdersSection from "./sections/orders-section";
import CashAdvancesSection from "./sections/cash-advances-section";
import PriceManagementSection from "./sections/price-management-section";
import BillingSection from "./sections/billing-section";
import EmployeeActivitySection from "./sections/employee-activity-section";
import DashboardStats from "./components/dashboard-stats";

const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function DashboardClient() {
	const [activeTab, setActiveTab] = useState("overview");

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-4xl font-bold text-slate-900">Admin Dashboard</h1>
					<p className="text-slate-600 mt-2">
						Manage orders, track cash advances, set prices, and monitor
						operations
					</p>
				</div>

				{/* Tabs */}
				<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
					<TabsList className="grid w-full grid-cols-6 mb-8">
						<TabsTrigger value="overview">Overview</TabsTrigger>
						<TabsTrigger value="orders">Orders</TabsTrigger>
						<TabsTrigger value="cash-advances">Cash Advances</TabsTrigger>
						<TabsTrigger value="prices">Prices</TabsTrigger>
						<TabsTrigger value="billing">Billing</TabsTrigger>
						<TabsTrigger value="employees">Employees</TabsTrigger>
					</TabsList>

					{/* Overview Tab */}
					<TabsContent value="overview" className="space-y-6">
						<DashboardStats />

						{/* Quick Charts */}
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
							{/* Orders Trend */}
							<Card>
								<CardHeader>
									<CardTitle>Orders Trend (Last 7 Days)</CardTitle>
									<CardDescription>Daily order volume</CardDescription>
								</CardHeader>
								<CardContent>
									<ResponsiveContainer width="100%" height={300}>
										<LineChart
											data={[
												{ date: "Mon", orders: 24, delivered: 18 },
												{ date: "Tue", orders: 32, delivered: 28 },
												{ date: "Wed", orders: 28, delivered: 24 },
												{ date: "Thu", orders: 35, delivered: 31 },
												{ date: "Fri", orders: 42, delivered: 38 },
												{ date: "Sat", orders: 38, delivered: 34 },
												{ date: "Sun", orders: 30, delivered: 26 },
											]}>
											<CartesianGrid strokeDasharray="3 3" />
											<XAxis dataKey="date" />
											<YAxis />
											<Tooltip />
											<Legend />
											<Line type="monotone" dataKey="orders" stroke="#3b82f6" />
											<Line
												type="monotone"
												dataKey="delivered"
												stroke="#10b981"
											/>
										</LineChart>
									</ResponsiveContainer>
								</CardContent>
							</Card>

							{/* Order Status Distribution */}
							<Card>
								<CardHeader>
									<CardTitle>Order Status</CardTitle>
									<CardDescription>Current distribution</CardDescription>
								</CardHeader>
								<CardContent>
									<ResponsiveContainer width="100%" height={300}>
										<PieChart>
											<Pie
												data={[
													{ name: "Pending", value: 15 },
													{ name: "Delivered", value: 85 },
												]}
												cx="50%"
												cy="50%"
												labelLine={false}
												label={({ name, value }) => `${name}: ${value}`}
												outerRadius={100}
												fill="#8884d8"
												dataKey="value">
												<Cell fill="#f59e0b" />
												<Cell fill="#10b981" />
											</Pie>
											<Tooltip />
										</PieChart>
									</ResponsiveContainer>
								</CardContent>
							</Card>
						</div>

						{/* Revenue and Cash Flow */}
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
							{/* Revenue Chart */}
							<Card>
								<CardHeader>
									<CardTitle>Revenue Trend</CardTitle>
									<CardDescription>Last 30 days revenue</CardDescription>
								</CardHeader>
								<CardContent>
									<ResponsiveContainer width="100%" height={300}>
										<BarChart
											data={[
												{ week: "Week 1", revenue: 12400 },
												{ week: "Week 2", revenue: 15300 },
												{ week: "Week 3", revenue: 18200 },
												{ week: "Week 4", revenue: 16800 },
											]}>
											<CartesianGrid strokeDasharray="3 3" />
											<XAxis dataKey="week" />
											<YAxis />
											<Tooltip
												formatter={(value) => `₹${value.toLocaleString()}`}
											/>
											<Bar dataKey="revenue" fill="#3b82f6" />
										</BarChart>
									</ResponsiveContainer>
								</CardContent>
							</Card>

							{/* Cash Advances Summary */}
							<Card>
								<CardHeader>
									<CardTitle>Cash Advances Summary</CardTitle>
									<CardDescription>Current status</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
										<span className="font-medium text-orange-900">
											Pending Reconciliation
										</span>
										<span className="text-2xl font-bold text-orange-600">
											₹24,500
										</span>
									</div>
									<div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
										<span className="font-medium text-green-900">
											Total Disbursed (Month)
										</span>
										<span className="text-2xl font-bold text-green-600">
											₹1,24,000
										</span>
									</div>
									<div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
										<span className="font-medium text-blue-900">
											Total Reconciled (Month)
										</span>
										<span className="text-2xl font-bold text-blue-600">
											₹99,500
										</span>
									</div>
								</CardContent>
							</Card>
						</div>
					</TabsContent>

					{/* Orders Tab */}
					<TabsContent value="orders">
						<OrdersSection />
					</TabsContent>

					{/* Cash Advances Tab */}
					<TabsContent value="cash-advances">
						<CashAdvancesSection />
					</TabsContent>

					{/* Price Management Tab */}
					<TabsContent value="prices">
						<PriceManagementSection />
					</TabsContent>

					{/* Billing Tab */}
					<TabsContent value="billing">
						<BillingSection />
					</TabsContent>

					{/* Employee Activity Tab */}
					<TabsContent value="employees">
						<EmployeeActivitySection />
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
