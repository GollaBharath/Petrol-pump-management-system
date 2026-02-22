"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Search, RefreshCw, Loader2 } from "lucide-react";
import { api } from "@/lib/api-client";

type OrderStatus = "PENDING" | "DELIVERED" | "BILLED" | "PAID";

interface Order {
	id: string;
	fuelType: "PETROL" | "DIESEL";
	quantityRequested: number | null;
	amountRequested: number | null;
	cashAdvance: number;
	status: OrderStatus;
	createdAt: string;
	deliveredAt: string | null;
	customer: {
		id: string;
		fullName: string;
		email: string;
		phone: string | null;
	};
	bills: Array<{ totalAmount: number; netAmount: number }>;
}

const STATUS_COLORS: Record<OrderStatus, string> = {
	PENDING: "bg-yellow-100 text-yellow-800",
	DELIVERED: "bg-blue-100 text-blue-800",
	BILLED: "bg-purple-100 text-purple-800",
	PAID: "bg-green-100 text-green-800",
};

export default function OrdersSection() {
	const [orders, setOrders] = useState<Order[]>([]);
	const [total, setTotal] = useState(0);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [filterStatus, setFilterStatus] = useState("all");

	const fetchOrders = useCallback(async () => {
		setLoading(true);
		try {
			const params = new URLSearchParams({ limit: "50" });
			if (filterStatus !== "all") params.set("status", filterStatus);
			const data = await api.get<{
				orders: Order[];
				pagination: { total: number };
			}>(`/api/orders?${params}`);
			setOrders(data.orders);
			setTotal(data.pagination.total);
		} catch (err) {
			console.error("Failed to fetch orders:", err);
		} finally {
			setLoading(false);
		}
	}, [filterStatus]);

	useEffect(() => {
		fetchOrders();
	}, [fetchOrders]);

	const filteredOrders = orders.filter((order) => {
		if (!searchTerm) return true;
		const q = searchTerm.toLowerCase();
		return (
			order.id.toLowerCase().includes(q) ||
			order.customer.fullName.toLowerCase().includes(q)
		);
	});

	const pendingCount = orders.filter((o) => o.status === "PENDING").length;
	const fulfilledCount = orders.filter((o) => o.status !== "PENDING").length;
	const fulfillmentRate =
		orders.length > 0 ? Math.round((fulfilledCount / orders.length) * 100) : 0;

	return (
		<div className="space-y-6">
			{/* Order Stats */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium">Total Orders</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">{total}</div>
						<p className="text-xs text-gray-600 mt-2">All time</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium">
							Pending Fulfillment
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold text-orange-600">
							{pendingCount}
						</div>
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
						<div className="text-3xl font-bold text-green-600">
							{fulfillmentRate}%
						</div>
						<p className="text-xs text-gray-600 mt-2">Loaded orders</p>
					</CardContent>
				</Card>
			</div>

			{/* Orders Table */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<div>
						<CardTitle>All Orders</CardTitle>
						<CardDescription>Manage and track all fuel orders</CardDescription>
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={fetchOrders}
						disabled={loading}>
						<RefreshCw
							className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
						/>
						Refresh
					</Button>
				</CardHeader>
				<CardContent>
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
							<SelectTrigger className="w-44">
								<SelectValue placeholder="Filter by status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Status</SelectItem>
								<SelectItem value="PENDING">Pending</SelectItem>
								<SelectItem value="DELIVERED">Delivered</SelectItem>
								<SelectItem value="BILLED">Billed</SelectItem>
								<SelectItem value="PAID">Paid</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{loading ? (
						<div className="flex items-center justify-center py-12">
							<Loader2 className="h-8 w-8 animate-spin text-gray-400" />
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Order ID</TableHead>
										<TableHead>Customer</TableHead>
										<TableHead>Fuel Type</TableHead>
										<TableHead className="text-right">Qty / Amt</TableHead>
										<TableHead className="text-right">
											Cash Advance (₹)
										</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Created At</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredOrders.map((order) => (
										<TableRow key={order.id}>
											<TableCell className="font-medium font-mono text-xs">
												{order.id.slice(0, 8)}…
											</TableCell>
											<TableCell>
												<div>
													<p className="font-medium">
														{order.customer.fullName}
													</p>
													<p className="text-xs text-gray-500">
														{order.customer.email}
													</p>
												</div>
											</TableCell>
											<TableCell>
												<Badge
													className={
														order.fuelType === "PETROL"
															? "bg-orange-100 text-orange-800"
															: "bg-gray-100 text-gray-800"
													}>
													{order.fuelType}
												</Badge>
											</TableCell>
											<TableCell className="text-right">
												{order.quantityRequested != null
													? `${order.quantityRequested} L`
													: order.amountRequested != null
														? `₹${order.amountRequested.toLocaleString()}`
														: "—"}
											</TableCell>
											<TableCell className="text-right">
												₹{order.cashAdvance.toLocaleString()}
											</TableCell>
											<TableCell>
												<Badge className={STATUS_COLORS[order.status]}>
													{order.status}
												</Badge>
											</TableCell>
											<TableCell className="text-sm text-gray-600">
												{new Date(order.createdAt).toLocaleString("en-IN")}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
							{filteredOrders.length === 0 && (
								<div className="text-center py-8 text-gray-500">
									No orders found
								</div>
							)}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
