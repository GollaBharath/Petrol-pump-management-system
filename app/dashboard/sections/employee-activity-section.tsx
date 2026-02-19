"use client";

import { useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Search, Activity } from "lucide-react";

interface Employee {
	id: string;
	name: string;
	email: string;
	phone: string;
	status: "ONLINE" | "OFFLINE" | "ON_DELIVERY";
	ordersCompletedToday: number;
	totalCashAdvanced: number;
	lastActivity: string;
	joinDate: string;
}

const mockEmployees: Employee[] = [
	{
		id: "EMP-001",
		name: "Rajesh Kumar",
		email: "rajesh.kumar@pump.com",
		phone: "+91-9876543210",
		status: "ONLINE",
		ordersCompletedToday: 8,
		totalCashAdvanced: 2000,
		lastActivity: "2 minutes ago",
		joinDate: "2024-01-15",
	},
	{
		id: "EMP-002",
		name: "Priya Singh",
		email: "priya.singh@pump.com",
		phone: "+91-9876543211",
		status: "ON_DELIVERY",
		ordersCompletedToday: 6,
		totalCashAdvanced: 2500,
		lastActivity: "5 minutes ago",
		joinDate: "2024-02-20",
	},
	{
		id: "EMP-003",
		name: "Mohammed Ali",
		email: "mohammed.ali@pump.com",
		phone: "+91-9876543212",
		status: "ONLINE",
		ordersCompletedToday: 9,
		totalCashAdvanced: 1500,
		lastActivity: "1 minute ago",
		joinDate: "2024-03-10",
	},
	{
		id: "EMP-004",
		name: "Anita Verma",
		email: "anita.verma@pump.com",
		phone: "+91-9876543213",
		status: "OFFLINE",
		ordersCompletedToday: 5,
		totalCashAdvanced: 2800,
		lastActivity: "2 hours ago",
		joinDate: "2024-04-05",
	},
];

function getStatusColor(status: Employee["status"]) {
	switch (status) {
		case "ONLINE":
			return "bg-green-100 text-green-800";
		case "ON_DELIVERY":
			return "bg-blue-100 text-blue-800";
		case "OFFLINE":
			return "bg-gray-100 text-gray-800";
		default:
			return "bg-gray-100 text-gray-800";
	}
}

function getStatusLabel(status: Employee["status"]) {
	switch (status) {
		case "ONLINE":
			return "Online";
		case "ON_DELIVERY":
			return "On Delivery";
		case "OFFLINE":
			return "Offline";
		default:
			return "Unknown";
	}
}

export default function EmployeeActivitySection() {
	const [searchTerm, setSearchTerm] = useState("");
	const [filterStatus, setFilterStatus] = useState<string>("all");

	const filteredEmployees = mockEmployees.filter((emp) => {
		const matchesSearch =
			emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			emp.id.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesStatus = filterStatus === "all" || emp.status === filterStatus;
		return matchesSearch && matchesStatus;
	});

	const onlineCount = mockEmployees.filter((e) => e.status === "ONLINE").length;
	const onDeliveryCount = mockEmployees.filter(
		(e) => e.status === "ON_DELIVERY",
	).length;
	const totalOrdersCompleted = mockEmployees.reduce(
		(sum, e) => sum + e.ordersCompletedToday,
		0,
	);

	return (
		<div className="space-y-6">
			{/* Employee Stats */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium">
							Total Employees
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">{mockEmployees.length}</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium">Online Now</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold text-green-600">
							{onlineCount}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium">On Delivery</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold text-blue-600">
							{onDeliveryCount}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium">
							Orders Completed Today
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">{totalOrdersCompleted}</div>
					</CardContent>
				</Card>
			</div>

			{/* Employee Activity Table */}
			<Card>
				<CardHeader>
					<CardTitle>Employee Activity Monitor</CardTitle>
					<CardDescription>
						Track employee status, activity, and performance
					</CardDescription>
				</CardHeader>
				<CardContent>
					{/* Filters */}
					<div className="flex gap-4 mb-6">
						<div className="flex-1 relative">
							<Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
							<Input
								placeholder="Search by name or employee ID..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-10"
							/>
						</div>
						<select
							value={filterStatus}
							onChange={(e) => setFilterStatus(e.target.value)}
							className="border rounded-lg px-4 py-2">
							<option value="all">All Status</option>
							<option value="ONLINE">Online</option>
							<option value="ON_DELIVERY">On Delivery</option>
							<option value="OFFLINE">Offline</option>
						</select>
					</div>

					{/* Table */}
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Employee</TableHead>
									<TableHead>ID</TableHead>
									<TableHead>Status</TableHead>
									<TableHead className="text-center">Orders Today</TableHead>
									<TableHead className="text-right">
										Cash Advanced (₹)
									</TableHead>
									<TableHead>Last Activity</TableHead>
									<TableHead className="text-right">Action</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredEmployees.map((emp) => (
									<TableRow key={emp.id}>
										<TableCell>
											<div>
												<p className="font-medium">{emp.name}</p>
												<p className="text-sm text-gray-600">{emp.email}</p>
											</div>
										</TableCell>
										<TableCell className="text-sm">{emp.id}</TableCell>
										<TableCell>
											<Badge className={getStatusColor(emp.status)}>
												{getStatusLabel(emp.status)}
											</Badge>
										</TableCell>
										<TableCell className="text-center font-medium">
											{emp.ordersCompletedToday}
										</TableCell>
										<TableCell className="text-right">
											₹{emp.totalCashAdvanced.toLocaleString()}
										</TableCell>
										<TableCell className="text-sm text-gray-600">
											{emp.lastActivity}
										</TableCell>
										<TableCell className="text-right">
											<Dialog>
												<DialogTrigger asChild>
													<Button variant="outline" size="sm">
														<Activity className="h-4 w-4 mr-2" />
														Details
													</Button>
												</DialogTrigger>
												<DialogContent>
													<DialogHeader>
														<DialogTitle>{emp.name}</DialogTitle>
														<DialogDescription>{emp.id}</DialogDescription>
													</DialogHeader>
													<div className="space-y-4">
														<div className="grid grid-cols-2 gap-4">
															<div>
																<p className="text-sm text-gray-600">Email</p>
																<p className="font-medium">{emp.email}</p>
															</div>
															<div>
																<p className="text-sm text-gray-600">Phone</p>
																<p className="font-medium">{emp.phone}</p>
															</div>
														</div>

														<div className="border-t pt-4 space-y-3">
															<div className="flex justify-between">
																<span className="text-gray-600">
																	Current Status:
																</span>
																<Badge className={getStatusColor(emp.status)}>
																	{getStatusLabel(emp.status)}
																</Badge>
															</div>
															<div className="flex justify-between">
																<span className="text-gray-600">
																	Orders Completed Today:
																</span>
																<span className="font-bold">
																	{emp.ordersCompletedToday}
																</span>
															</div>
															<div className="flex justify-between">
																<span className="text-gray-600">
																	Total Cash Advanced:
																</span>
																<span className="font-bold">
																	₹{emp.totalCashAdvanced.toLocaleString()}
																</span>
															</div>
															<div className="flex justify-between">
																<span className="text-gray-600">
																	Last Activity:
																</span>
																<span className="font-medium">
																	{emp.lastActivity}
																</span>
															</div>
															<div className="flex justify-between">
																<span className="text-gray-600">Joined:</span>
																<span className="font-medium">
																	{emp.joinDate}
																</span>
															</div>
														</div>

														<div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-900">
															<p className="font-medium mb-2">
																Performance Metrics
															</p>
															<ul className="space-y-1">
																<li>Average: 7.5 orders/day</li>
																<li>On-time delivery: 98%</li>
																<li>Rating: 4.8/5.0</li>
															</ul>
														</div>
													</div>
												</DialogContent>
											</Dialog>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>

					{filteredEmployees.length === 0 && (
						<div className="text-center py-8 text-gray-500">
							No employees found
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
