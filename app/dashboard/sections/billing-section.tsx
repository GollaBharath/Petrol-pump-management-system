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
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Search, Download } from "lucide-react";

interface Bill {
	id: string;
	customerName: string;
	orderId: string;
	quantityDelivered: number;
	pricePerLiter: number;
	totalAmount: number;
	cashAdvance: number;
	settlementAmount: number;
	status: "PENDING" | "PAID" | "OVERDUE";
	createdAt: string;
	dueDate: string;
}

const mockBills: Bill[] = [
	{
		id: "BILL-001",
		customerName: "Rajesh Kumar",
		orderId: "ORD-001",
		quantityDelivered: 20,
		pricePerLiter: 102.5,
		totalAmount: 2050,
		cashAdvance: 2000,
		settlementAmount: 50,
		status: "PAID",
		createdAt: "2026-02-19 09:15",
		dueDate: "2026-02-24",
	},
	{
		id: "BILL-002",
		customerName: "Anita Verma",
		orderId: "ORD-004",
		quantityDelivered: 30,
		pricePerLiter: 102.5,
		totalAmount: 3075,
		cashAdvance: 2800,
		settlementAmount: 275,
		status: "PENDING",
		createdAt: "2026-02-19 07:45",
		dueDate: "2026-02-24",
	},
	{
		id: "BILL-003",
		customerName: "Vikram Patel",
		orderId: "ORD-005",
		quantityDelivered: 10,
		pricePerLiter: 102.25,
		totalAmount: 1022.5,
		cashAdvance: 1000,
		settlementAmount: 22.5,
		status: "PAID",
		createdAt: "2026-02-18 17:00",
		dueDate: "2026-02-23",
	},
	{
		id: "BILL-004",
		customerName: "Mohammed Khan",
		orderId: "ORD-006",
		quantityDelivered: 25,
		pricePerLiter: 102.0,
		totalAmount: 2550,
		cashAdvance: 2400,
		settlementAmount: 150,
		status: "OVERDUE",
		createdAt: "2026-02-15 14:20",
		dueDate: "2026-02-18",
	},
];

function getStatusColor(status: Bill["status"]) {
	switch (status) {
		case "PENDING":
			return "bg-yellow-100 text-yellow-800";
		case "PAID":
			return "bg-green-100 text-green-800";
		case "OVERDUE":
			return "bg-red-100 text-red-800";
		default:
			return "bg-gray-100 text-gray-800";
	}
}

export default function BillingSection() {
	const [searchTerm, setSearchTerm] = useState("");
	const [filterStatus, setFilterStatus] = useState<string>("all");

	const filteredBills = mockBills.filter((bill) => {
		const matchesSearch =
			bill.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
			bill.customerName.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesStatus =
			filterStatus === "all" || bill.status === filterStatus;
		return matchesSearch && matchesStatus;
	});

	const stats = {
		total: mockBills.length,
		paid: mockBills.filter((b) => b.status === "PAID").length,
		pending: mockBills.filter((b) => b.status === "PENDING").length,
		overdue: mockBills.filter((b) => b.status === "OVERDUE").length,
		totalRevenue: mockBills.reduce((sum, b) => sum + b.totalAmount, 0),
		pendingAmount: mockBills
			.filter((b) => b.status === "PENDING" || b.status === "OVERDUE")
			.reduce((sum, b) => sum + b.settlementAmount, 0),
	};

	return (
		<div className="space-y-6">
			{/* Billing Stats */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium">Total Bills</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">{stats.total}</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium">Paid</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold text-green-600">
							{stats.paid}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium">Pending</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold text-yellow-600">
							{stats.pending}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium">Overdue</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold text-red-600">
							{stats.overdue}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Revenue Summary */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">
							₹{stats.totalRevenue.toLocaleString()}
						</div>
						<p className="text-xs text-gray-600 mt-2">From fuel delivery</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium">
							Outstanding Amount
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold text-orange-600">
							₹{stats.pendingAmount.toLocaleString()}
						</div>
						<p className="text-xs text-gray-600 mt-2">Awaiting settlement</p>
					</CardContent>
				</Card>
			</div>

			{/* Bills Table */}
			<Card>
				<CardHeader>
					<CardTitle>All Bills</CardTitle>
					<CardDescription>
						Track customer billing and payment status
					</CardDescription>
				</CardHeader>
				<CardContent>
					{/* Filters */}
					<div className="flex gap-4 mb-6">
						<div className="flex-1 relative">
							<Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
							<Input
								placeholder="Search by bill ID or customer name..."
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
							<option value="PENDING">Pending</option>
							<option value="PAID">Paid</option>
							<option value="OVERDUE">Overdue</option>
						</select>
					</div>

					{/* Table */}
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Bill ID</TableHead>
									<TableHead>Customer</TableHead>
									<TableHead>Order ID</TableHead>
									<TableHead className="text-right">Amount (₹)</TableHead>
									<TableHead className="text-right">Cash Advance (₹)</TableHead>
									<TableHead className="text-right">Settlement (₹)</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Due Date</TableHead>
									<TableHead className="text-right">Action</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredBills.map((bill) => (
									<TableRow key={bill.id}>
										<TableCell className="font-medium">{bill.id}</TableCell>
										<TableCell>{bill.customerName}</TableCell>
										<TableCell>{bill.orderId}</TableCell>
										<TableCell className="text-right">
											₹{bill.totalAmount.toLocaleString()}
										</TableCell>
										<TableCell className="text-right">
											₹{bill.cashAdvance.toLocaleString()}
										</TableCell>
										<TableCell className="text-right font-medium">
											₹{bill.settlementAmount.toLocaleString()}
										</TableCell>
										<TableCell>
											<Badge className={getStatusColor(bill.status)}>
												{bill.status}
											</Badge>
										</TableCell>
										<TableCell className="text-sm text-gray-600">
											{bill.dueDate}
										</TableCell>
										<TableCell className="text-right">
											<Dialog>
												<DialogTrigger asChild>
													<Button variant="outline" size="sm">
														View
													</Button>
												</DialogTrigger>
												<DialogContent>
													<DialogHeader>
														<DialogTitle>{bill.id}</DialogTitle>
														<DialogDescription>
															{bill.customerName}
														</DialogDescription>
													</DialogHeader>
													<div className="space-y-4">
														<div className="grid grid-cols-2 gap-4">
															<div>
																<p className="text-sm text-gray-600">
																	Order ID
																</p>
																<p className="font-medium">{bill.orderId}</p>
															</div>
															<div>
																<p className="text-sm text-gray-600">Status</p>
																<Badge className={getStatusColor(bill.status)}>
																	{bill.status}
																</Badge>
															</div>
														</div>

														<div className="border-t pt-4 space-y-2">
															<div className="flex justify-between">
																<span>Quantity Delivered:</span>
																<span className="font-medium">
																	{bill.quantityDelivered} L
																</span>
															</div>
															<div className="flex justify-between">
																<span>Price Per Liter:</span>
																<span className="font-medium">
																	₹{bill.pricePerLiter.toFixed(2)}
																</span>
															</div>
															<div className="flex justify-between border-t pt-2 font-bold">
																<span>Total Amount:</span>
																<span>
																	₹{bill.totalAmount.toLocaleString()}
																</span>
															</div>
														</div>

														<div className="bg-blue-50 p-3 rounded-lg space-y-1">
															<div className="flex justify-between text-sm">
																<span className="text-blue-900">
																	Cash Advanced:
																</span>
																<span className="font-medium">
																	₹{bill.cashAdvance.toLocaleString()}
																</span>
															</div>
															<div className="flex justify-between text-sm">
																<span className="text-blue-900">
																	Settlement Due:
																</span>
																<span className="font-medium">
																	₹{bill.settlementAmount.toLocaleString()}
																</span>
															</div>
														</div>

														{bill.status !== "PAID" && (
															<Button className="w-full">Mark as Paid</Button>
														)}
													</div>
												</DialogContent>
											</Dialog>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>

					{filteredBills.length === 0 && (
						<div className="text-center py-8 text-gray-500">
							No bills found matching your criteria
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
