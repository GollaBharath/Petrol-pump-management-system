/**
 * Admin Dashboard API Utilities
 *
 * Helper functions for fetching and aggregating data for the admin dashboard
 * These utilities work with existing API endpoints and aggregate data for display
 */

import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

/**
 * Get dashboard overview stats
 * Includes total orders, revenue, cash advances, and employee metrics
 */
export async function getDashboardStats() {
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const [
		totalOrders,
		pendingOrders,
		deliveredOrders,
		totalRevenue,
		pendingCashAdvances,
		totalCashAdvanced,
		activeEmployees,
	] = await Promise.all([
		// Total orders (all time)
		prisma.order.count(),
		// Pending orders
		prisma.order.count({
			where: { status: "PENDING" },
		}),
		// Delivered orders today
		prisma.order.count({
			where: {
				status: "DELIVERED",
				deliveredAt: {
					gte: today,
				},
			},
		}),
		// Total revenue (sum of bills)
		prisma.bill.aggregate({
			_sum: {
				totalAmount: true,
			},
		}),
		// Pending cash advances (not reconciled)
		prisma.cashAdvanceTransaction.count({
			where: { type: "DISBURSED" },
		}),
		// Total cash advanced
		prisma.cashAdvanceTransaction.aggregate({
			_sum: {
				amount: true,
			},
			where: { type: "DISBURSED" },
		}),
		// Active employees (online)
		prisma.user.count({
			where: { role: "EMPLOYEE" },
		}),
	]);

	return {
		totalOrders,
		pendingOrders,
		deliveredTodayOrders: deliveredOrders,
		totalRevenue: totalRevenue._sum.totalAmount || 0,
		pendingCashAdvances,
		totalCashAdvanced: totalCashAdvanced._sum.amount || 0,
		activeEmployees,
	};
}

/**
 * Get orders with details for dashboard display
 */
export async function getOrdersForDashboard(
	limit: number = 10,
	offset: number = 0,
	status?: "PENDING" | "DELIVERED" | "CANCELLED",
) {
	const orders = await prisma.order.findMany({
		where: status ? { status } : undefined,
		include: {
			customer: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},
			bill: {
				select: {
					id: true,
					totalAmount: true,
					status: true,
				},
			},
		},
		orderBy: {
			createdAt: "desc",
		},
		take: limit,
		skip: offset,
	});

	const total = await prisma.order.count({
		where: status ? { status } : undefined,
	});

	return {
		orders,
		total,
		page: Math.floor(offset / limit) + 1,
		pageSize: limit,
	};
}

/**
 * Get cash advances with tracking information
 */
export async function getCashAdvancesForDashboard(
	limit: number = 10,
	offset: number = 0,
	status?: "DISBURSED" | "RECONCILED",
) {
	const advances = await prisma.cashAdvanceTransaction.findMany({
		where: status ? { type: status } : undefined,
		include: {
			employee: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},
			order: {
				select: {
					id: true,
					quantityOrdered: true,
				},
			},
			bill: {
				select: {
					id: true,
					totalAmount: true,
				},
			},
		},
		orderBy: {
			createdAt: "desc",
		},
		take: limit,
		skip: offset,
	});

	const total = await prisma.cashAdvanceTransaction.count({
		where: status ? { type: status } : undefined,
	});

	return {
		advances,
		total,
		page: Math.floor(offset / limit) + 1,
		pageSize: limit,
	};
}

/**
 * Get bills with payment tracking
 */
export async function getBillsForDashboard(
	limit: number = 10,
	offset: number = 0,
	status?: "PENDING" | "PAID",
) {
	const bills = await prisma.bill.findMany({
		where: status ? { status } : undefined,
		include: {
			order: {
				select: {
					id: true,
					customer: {
						select: {
							name: true,
							email: true,
						},
					},
				},
			},
			cashAdvance: {
				select: {
					amount: true,
				},
			},
		},
		orderBy: {
			createdAt: "desc",
		},
		take: limit,
		skip: offset,
	});

	const total = await prisma.bill.count({
		where: status ? { status } : undefined,
	});

	return {
		bills,
		total,
		page: Math.floor(offset / limit) + 1,
		pageSize: limit,
	};
}

/**
 * Get employee activity summary
 */
export async function getEmployeeActivityForDashboard(limit: number = 10) {
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const employees = await prisma.user.findMany({
		where: { role: "EMPLOYEE" },
		select: {
			id: true,
			name: true,
			email: true,
			orders: {
				where: {
					deliveredAt: {
						gte: today,
					},
				},
				select: {
					id: true,
				},
			},
			cashAdvances: {
				where: {
					createdAt: {
						gte: today,
					},
				},
				select: {
					amount: true,
				},
			},
		},
		take: limit,
	});

	return employees.map((emp) => ({
		id: emp.id,
		name: emp.name,
		email: emp.email,
		ordersCompletedToday: emp.orders.length,
		totalCashAdvancedToday: emp.cashAdvances.reduce(
			(sum, ca) => sum + ca.amount,
			0,
		),
	}));
}

/**
 * Get price update status
 */
export async function getPriceStatusForDashboard() {
	const fuelTypes = ["PETROL", "DIESEL"];
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const prices = await Promise.all(
		fuelTypes.map(async (fuelType) => {
			const latestPrice = await prisma.fuelPrice.findFirst({
				where: { fuelType: fuelType as any },
				orderBy: { date: "desc" },
				select: {
					pricePerLiter: true,
					date: true,
				},
			});

			if (!latestPrice) {
				return {
					fuelType,
					currentPrice: null,
					lastUpdated: null,
					needsUpdate: true,
					hoursOverdue: 24,
				};
			}

			const hoursSinceUpdate = Math.floor(
				(new Date().getTime() - new Date(latestPrice.date).getTime()) /
					(1000 * 60 * 60),
			);
			const needsUpdate = hoursSinceUpdate > 24;

			return {
				fuelType,
				currentPrice: latestPrice.pricePerLiter,
				lastUpdated: latestPrice.date,
				needsUpdate,
				hoursOverdue: Math.max(0, hoursSinceUpdate - 24),
			};
		}),
	);

	return prices;
}

/**
 * Get revenue trend for the last 30 days
 */
export async function getRevenueTrend(days: number = 30) {
	const startDate = new Date();
	startDate.setDate(startDate.getDate() - days);

	const dailyRevenue = await prisma.bill.groupBy({
		by: ["createdAt"],
		where: {
			createdAt: {
				gte: startDate,
			},
			status: "PAID",
		},
		_sum: {
			totalAmount: true,
		},
	});

	return dailyRevenue.map((record) => ({
		date: record.createdAt.toISOString().split("T")[0],
		revenue: record._sum.totalAmount || 0,
	}));
}
