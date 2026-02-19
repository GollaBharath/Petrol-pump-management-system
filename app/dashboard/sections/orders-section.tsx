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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Search, ChevronRight } from "lucide-react";

interface Order {
	id: string;
	customerName: string;
	fuelType: string;
	quantity: number;
	amount: number;
	status: "PENDING" | "DELIVERED" | "CANCELLED";
	createdAt: string;
	deliveredAt?: string;
}

const mockOrders: Order[] = [
	{
		id: "ORD-001",
		customerName: "Rajesh Kumar",
		fuelType: "PETROL",
		quantity: 20,
		amount: 2050,
		status: "DELIVERED",
		createdAt: "2026-02-19 08:30",
		deliveredAt: "2026-02-19 09:15",
	},
	{
		id: "ORD-002",
		customerName: "Priya Singh",
		fuelType: "DIESEL",
		quantity: 25,
		amount: 2375,
		status: "PENDING",
		createdAt: "2026-02-19 10:45",
	},
	{
		id: "ORD-003",
		customerName: "Mohammed Ali",
		fuelType: "PETROL",
		quantity: 15,
		amount: 1537,
		status: "PENDING",
		createdAt: "2026-02-19 11:20",
	},
	{
		id: "ORD-004",
		customerName: "Anita Verma",
		fuelType: "DIESEL",
		quantity: 30,
		amount: 2850,
		status: "DELIVERED",
		createdAt: "2026-02-19 07:00",
		deliveredAt: "2026-02-19 07:45",
	},
	{
		id: "ORD-005",
		customerName: "Vikram Patel",
		fuelType: "PETROL",
		quantity: 10,
		amount: 1025,
		status: "DELIVERED",
		createdAt: "2026-02-18 16:30",
		deliveredAt: "2026-02-18 17:00",
	},
];

function getStatusColor(status: Order["status"]) {
	switch (status) {
		case "PENDING":
			return "bg-yellow-100 text-yellow-800";
		case "DELIVERED":
			return "bg-green-100 text-green-800";
		case "CANCELLED":
			return "bg-red-100 text-red-800";
		default:
			return "bg-gray-100 text-gray-800";
	}
}

export default function OrdersSection() {
	const [searchTerm, setSearchTerm] = useState("");
	const [filterStatus, setFilterStatus] = useState<string>("all");

	const filteredOrders = mockOrders.filter((order) => {
		const matchesSearch =
			order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
			order.customerName.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesStatus =
			filterStatus === "all" || order.status === filterStatus;
		return matchesSearch && matchesStatus;
	});

	return (
		<div className="space-y-6">
			{/* Order Stats */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium">
							Total Orders Today
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">42</div>
						<p className="text-xs text-gray-600 mt-2">+5 from yesterday</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium">
							Pending Fulfillment
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold text-orange-600">8</div>
						<p className="text-xs text-gray-600 mt-2">Awaiting delivery</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium">
							Fulfillment Rate
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold text-green-600">95%</div>
						<p className="text-xs text-gray-600 mt-2">Same-day completion</p>
					</CardContent>
				</Card>
			</div>

			{/* Orders Table */}
			<Card>
				<CardHeader>
					<CardTitle>All Orders</CardTitle>
					<CardDescription>Manage and track all fuel orders</CardDescription>
				</CardHeader>
				<CardContent>
					{/* Filters */}
					<div className="flex gap-4 mb-6">
						<div className="flex-1 relative">
							<Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
							<Input
								placeholder="Search by order ID or customer name..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-10"
							/>
						</div>
						<Select value={filterStatus} onValueChange={setFilterStatus}>
							<SelectTrigger className="w-40">
								<SelectValue placeholder="Filter by status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Status</SelectItem>
								<SelectItem value="PENDING">Pending</SelectItem>
								<SelectItem value="DELIVERED">Delivered</SelectItem>
								<SelectItem value="CANCELLED">Cancelled</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Table */}
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Order ID</TableHead>
									<TableHead>Customer</TableHead>
									<TableHead>Fuel Type</TableHead>
									<TableHead className="text-right">Quantity (L)</TableHead>
									<TableHead className="text-right">Amount (₹)</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Created At</TableHead>
									<TableHead className="text-right">Action</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredOrders.map((order) => (
									<TableRow key={order.id}>
										<TableCell className="font-medium">{order.id}</TableCell>
										<TableCell>{order.customerName}</TableCell>
										<TableCell>{order.fuelType}</TableCell>
										<TableCell className="text-right">
											{order.quantity}
										</TableCell>
										<TableCell className="text-right">
											₹{order.amount.toLocaleString()}
										</TableCell>
										<TableCell>
											<Badge className={getStatusColor(order.status)}>
												{order.status}
											</Badge>
										</TableCell>
										<TableCell className="text-sm text-gray-600">
											{order.createdAt}
										</TableCell>
										<TableCell className="text-right">
											<Button variant="ghost" size="sm">
												<ChevronRight className="h-4 w-4" />
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>

					{filteredOrders.length === 0 && (
						<div className="text-center py-8 text-gray-500">
							No orders found matching your criteria
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
