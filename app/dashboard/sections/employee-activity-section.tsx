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
import { Input } from "@/components/ui/input";
import { Search, RefreshCw, Loader2 } from "lucide-react";
import { api } from "@/lib/api-client";

interface Employee {
	id: string;
	fullName: string;
	email: string;
	phone: string;
	role: string;
	createdAt: string;
	_count: {
		orders: number;
	};
}

export default function EmployeeActivitySection() {
	const [employees, setEmployees] = useState<Employee[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [total, setTotal] = useState(0);

	const fetchEmployees = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const data = await api.get<{
				users: Employee[];
				pagination: { total: number };
			}>("/api/admin/users?role=EMPLOYEE&limit=100");
			setEmployees(data.users);
			setTotal(data.pagination.total);
		} catch (err: any) {
			setError(err.message || "Failed to fetch employees");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchEmployees();
	}, [fetchEmployees]);

	const filteredEmployees = employees.filter((emp) => {
		if (!searchTerm) return true;
		const q = searchTerm.toLowerCase();
		return (
			emp.fullName.toLowerCase().includes(q) ||
			emp.email.toLowerCase().includes(q)
		);
	});

	const totalOrders = employees.reduce((s, e) => s + e._count.orders, 0);

	return (
		<div className="space-y-6">
			{/* Stats */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium">
							Total Employees
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">{total}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium">
							Total Orders Handled
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">{totalOrders}</div>
					</CardContent>
				</Card>
			</div>

			{/* Employee Table */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<div>
						<CardTitle>Employee Directory</CardTitle>
						<CardDescription>
							All registered employees and their activity
						</CardDescription>
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={fetchEmployees}
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
								placeholder="Search by name or email..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-10"
							/>
						</div>
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
										<TableHead>Employee</TableHead>
										<TableHead>Phone</TableHead>
										<TableHead className="text-center">Orders</TableHead>
										<TableHead>Joined</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredEmployees.map((emp) => (
										<TableRow key={emp.id}>
											<TableCell>
												<div>
													<p className="font-medium">{emp.fullName}</p>
													<p className="text-sm text-gray-500">{emp.email}</p>
												</div>
											</TableCell>
											<TableCell className="text-sm">
												{emp.phone || "—"}
											</TableCell>
											<TableCell className="text-center font-medium">
												{emp._count.orders}
											</TableCell>
											<TableCell className="text-sm text-gray-600">
												{new Date(emp.createdAt).toLocaleDateString("en-IN")}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
							{filteredEmployees.length === 0 && (
								<div className="text-center py-8 text-gray-500">
									No employees found
								</div>
							)}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
