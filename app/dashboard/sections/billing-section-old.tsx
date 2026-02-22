"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import { Search, RefreshCw, Loader2, Eye } from "lucide-react";
import { api } from "@/lib/api-client";

interface CustomerProfile {
	id: string;
	currentBalance: number;
	totalOrders: number;
	totalPurchases: number;
	totalPayments: number;
}

interface Customer {
	id: string;
	fullName: string;
	email: string;
	phone: string | null;
	customerProfile: CustomerProfile | null;
	_count: {
		orders: number;
	};
}

export default function BillingSection() {
	const router = useRouter();
	const [customers, setCustomers] = useState<Customer[]>([]);
	const [total, setTotal] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [summary, setSummary] = useState({
		totalCustomers: 0,
		totalOutstanding: 0,
		totalBalance: 0,
	});

	const fetchCustomers = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const params = new URLSearchParams({ limit: "100" });
			if (searchTerm) params.set("search", searchTerm);

			const data = await api.get<{
				customers: Customer[];
				pagination: { total: number };
				summary: {
					totalCustomers: number;
					totalOutstanding: number;
					totalBalance: number;
				};
			}>(`/api/customers?${params}`);

			setCustomers(data.customers);
			setTotal(data.pagination.total);
			setSummary(data.summary);
		} catch (err: any) {
			setError(err.message || "Failed to fetch customers");
		} finally {
			setLoading(false);
		}
	}, [searchTerm]);

	useEffect(() => {
		fetchCustomers();
	}, [fetchCustomers]);

	const getBalanceColor = (balance: number) => {
		if (balance < 0) return "text-red-600"; // Customer owes money
		if (balance > 0) return "text-green-600"; // Customer credit
		return "text-gray-600"; // Balanced
	};

	const getBalanceBadge = (balance: number) => {
		if (balance < 0) {
			return (
				<Badge className="bg-red-100 text-red-800">
					Owes ₹{Math.abs(balance).toLocaleString("en-IN")}
				</Badge>
			);
		}
		if (balance > 0) {
			return (
				<Badge className="bg-green-100 text-green-800">
					Credit ₹{balance.toLocaleString("en-IN")}
				</Badge>
			);
		}
		return <Badge className="bg-gray-100 text-gray-800">Clear</Badge>;
	};

	return (
		<div className="space-y-6">
			{/* Stats */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium">
							Total Customers
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">{summary.totalCustomers}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium">
							Total Outstanding
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold text-red-600">
							₹{summary.totalOutstanding.toLocaleString("en-IN")}
						</div>
						<p className="text-sm text-gray-500 mt-1">Amount due from customers</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium">Net Balance</CardTitle>
					</CardHeader>
					<CardContent>
						<div
							className={`text-3xl font-bold ${
								summary.totalBalance < 0 ? "text-red-600" : "text-green-600"
							}`}>
							₹{Math.abs(summary.totalBalance).toLocaleString("en-IN")}
						</div>
						<p className="text-sm text-gray-500 mt-1">
							{summary.totalBalance < 0 ? "Receivable" : "Payable"}
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Customers Table */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<div>
						<CardTitle>Customer Billing</CardTitle>
						<CardDescription>
							Track customer balances and payment history
						</CardDescription>
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={fetchCustomers}
						disabled={loading}>
						<RefreshCw
							className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
						/>
						Refresh
					</Button>
				</CardHeader>
				<CardContent>
					<div className="mb-6 relative">
						<Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
						<Input
							placeholder="Search by customer name, email, or phone..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="pl-10"
						/>
					</div>

					{error && (
						<div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 mb-4">
							{error}
						</div>
					)}

					{loading ? (
						<div className="flex items-center justify-center py-12">
							<Loader2 className="h-8 w-8 animate-spin text-gray-400" />
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Customer</TableHead>
										<TableHead>Phone</TableHead>
										<TableHead className="text-right">Total Orders</TableHead>
										<TableHead className="text-right">
											Total Purchases
										</TableHead>
										<TableHead className="text-right">Payments Made</TableHead>
										<TableHead className="text-right">Balance</TableHead>
										<TableHead className="text-right">Action</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{customers.map((customer) => {
										const balance =
											customer.customerProfile?.currentBalance || 0;
										const totalOrders = customer.customerProfile?.totalOrders || 0;
										const totalPurchases =
											customer.customerProfile?.totalPurchases || 0;
										const totalPayments =
											customer.customerProfile?.totalPayments || 0;

										return (
											<TableRow
												key={customer.id}
												className="cursor-pointer hover:bg-gray-50"
												onClick={() =>
													router.push(`/dashboard/customers/${customer.id}`)
												}>
												<TableCell>
													<div>
														<p className="font-medium">{customer.fullName}</p>
														<p className="text-xs text-gray-500">
															{customer.email}
														</p>
													</div>
												</TableCell>
												<TableCell className="text-sm">
													{customer.phone || "—"}
												</TableCell>
												<TableCell className="text-right font-medium">
													{totalOrders}
												</TableCell>
												<TableCell className="text-right">
													₹{totalPurchases.toLocaleString("en-IN")}
												</TableCell>
												<TableCell className="text-right">
													₹{totalPayments.toLocaleString("en-IN")}
												</TableCell>
												<TableCell className="text-right">
													{getBalanceBadge(balance)}
												</TableCell>
												<TableCell className="text-right">
													<Button
														variant="outline"
														size="sm"
														onClick={(e) => {
															e.stopPropagation();
															router.push(`/dashboard/customers/${customer.id}`);
														}}>
														<Eye className="h-4 w-4 mr-1" />
														View
													</Button>
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
							{customers.length === 0 && (
								<div className="text-center py-8 text-gray-500">
									No customers found
								</div>
							)}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
