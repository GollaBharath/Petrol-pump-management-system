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
import { Search, CheckCircle } from "lucide-react";

interface CashAdvance {
	id: string;
	employeeName: string;
	amount: number;
	disburseDate: string;
	orderId: string;
	status: "DISBURSED" | "RECONCILED" | "PARTIAL";
	billAmount?: number;
	settlementAmount?: number;
}

const mockCashAdvances: CashAdvance[] = [
	{
		id: "CA-001",
		employeeName: "Rajesh Kumar",
		amount: 2000,
		disburseDate: "2026-02-19 08:30",
		orderId: "ORD-001",
		status: "RECONCILED",
		billAmount: 2050,
		settlementAmount: 50,
	},
	{
		id: "CA-002",
		employeeName: "Priya Singh",
		amount: 2500,
		disburseDate: "2026-02-19 10:45",
		orderId: "ORD-002",
		status: "DISBURSED",
	},
	{
		id: "CA-003",
		employeeName: "Mohammed Ali",
		amount: 1500,
		disburseDate: "2026-02-19 11:20",
		orderId: "ORD-003",
		status: "DISBURSED",
	},
	{
		id: "CA-004",
		employeeName: "Anita Verma",
		amount: 2800,
		disburseDate: "2026-02-19 07:00",
		orderId: "ORD-004",
		status: "RECONCILED",
		billAmount: 2850,
		settlementAmount: 50,
	},
];

function getStatusColor(status: CashAdvance["status"]) {
	switch (status) {
		case "DISBURSED":
			return "bg-blue-100 text-blue-800";
		case "RECONCILED":
			return "bg-green-100 text-green-800";
		case "PARTIAL":
			return "bg-yellow-100 text-yellow-800";
		default:
			return "bg-gray-100 text-gray-800";
	}
}

export default function CashAdvancesSection() {
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedAdvance, setSelectedAdvance] = useState<CashAdvance | null>(
		null,
	);

	const filteredAdvances = mockCashAdvances.filter(
		(adv) =>
			adv.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
			adv.id.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	const totalDisbursed = mockCashAdvances.reduce(
		(sum, adv) => sum + adv.amount,
		0,
	);
	const totalReconciled = mockCashAdvances
		.filter((adv) => adv.status === "RECONCILED")
		.reduce((sum, adv) => sum + (adv.settlementAmount || 0), 0);
	const pendingReconciliation = mockCashAdvances
		.filter((adv) => adv.status === "DISBURSED")
		.reduce((sum, adv) => sum + adv.amount, 0);

	return (
		<div className="space-y-6">
			{/* Cash Advances Stats */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium">
							Total Disbursed Today
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">
							₹{totalDisbursed.toLocaleString()}
						</div>
						<p className="text-xs text-gray-600 mt-2">To 4 employees</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium">
							Pending Reconciliation
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold text-orange-600">
							₹{pendingReconciliation.toLocaleString()}
						</div>
						<p className="text-xs text-gray-600 mt-2">
							2 advances awaiting bills
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium">
							Total Reconciled
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold text-green-600">
							₹{totalReconciled.toLocaleString()}
						</div>
						<p className="text-xs text-gray-600 mt-2">Settled today</p>
					</CardContent>
				</Card>
			</div>

			{/* Cash Advances Table */}
			<Card>
				<CardHeader>
					<CardTitle>Cash Advances Tracking</CardTitle>
					<CardDescription>
						Monitor all cash advance disbursements and reconciliations
					</CardDescription>
				</CardHeader>
				<CardContent>
					{/* Search */}
					<div className="flex gap-4 mb-6">
						<div className="flex-1 relative">
							<Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
							<Input
								placeholder="Search by employee name or CA ID..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-10"
							/>
						</div>
					</div>

					{/* Table */}
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>CA ID</TableHead>
									<TableHead>Employee</TableHead>
									<TableHead className="text-right">Amount (₹)</TableHead>
									<TableHead>Order ID</TableHead>
									<TableHead>Disburse Date</TableHead>
									<TableHead>Status</TableHead>
									<TableHead className="text-right">Action</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredAdvances.map((adv) => (
									<TableRow key={adv.id}>
										<TableCell className="font-medium">{adv.id}</TableCell>
										<TableCell>{adv.employeeName}</TableCell>
										<TableCell className="text-right">
											₹{adv.amount.toLocaleString()}
										</TableCell>
										<TableCell className="text-sm text-gray-600">
											{adv.orderId}
										</TableCell>
										<TableCell className="text-sm text-gray-600">
											{adv.disburseDate}
										</TableCell>
										<TableCell>
											<Badge className={getStatusColor(adv.status)}>
												{adv.status}
											</Badge>
										</TableCell>
										<TableCell className="text-right">
											<Dialog>
												<DialogTrigger asChild>
													<Button
														variant="outline"
														size="sm"
														onClick={() => setSelectedAdvance(adv)}>
														Details
													</Button>
												</DialogTrigger>
												<DialogContent>
													<DialogHeader>
														<DialogTitle>Cash Advance Details</DialogTitle>
														<DialogDescription>
															{adv.id} - {adv.employeeName}
														</DialogDescription>
													</DialogHeader>
													<div className="space-y-4">
														<div className="grid grid-cols-2 gap-4">
															<div>
																<p className="text-sm text-gray-600">
																	Amount Disbursed
																</p>
																<p className="text-2xl font-bold">
																	₹{adv.amount.toLocaleString()}
																</p>
															</div>
															<div>
																<p className="text-sm text-gray-600">Status</p>
																<Badge className={getStatusColor(adv.status)}>
																	{adv.status}
																</Badge>
															</div>
														</div>

														{adv.status === "RECONCILED" && (
															<div className="bg-green-50 p-4 rounded-lg">
																<p className="text-sm text-green-900 font-medium mb-2">
																	Reconciliation Details
																</p>
																<div className="space-y-1 text-sm">
																	<div className="flex justify-between">
																		<span className="text-gray-600">
																			Bill Amount:
																		</span>
																		<span className="font-medium">
																			₹{adv.billAmount?.toLocaleString()}
																		</span>
																	</div>
																	<div className="flex justify-between">
																		<span className="text-gray-600">
																			Settlement Amount:
																		</span>
																		<span className="font-medium">
																			₹{adv.settlementAmount?.toLocaleString()}
																		</span>
																	</div>
																</div>
															</div>
														)}

														{adv.status === "DISBURSED" && (
															<div className="bg-blue-50 p-4 rounded-lg">
																<p className="text-sm text-blue-900">
																	Awaiting bill for order {adv.orderId}
																</p>
															</div>
														)}

														{adv.status === "DISBURSED" && (
															<Button className="w-full">
																<CheckCircle className="h-4 w-4 mr-2" />
																Reconcile Now
															</Button>
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

					{filteredAdvances.length === 0 && (
						<div className="text-center py-8 text-gray-500">
							No cash advances found
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
