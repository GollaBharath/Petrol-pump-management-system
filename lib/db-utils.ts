import { prisma } from "./prisma";
import { FuelType, OrderStatus } from "@prisma/client";

/**
 * Get the fuel price for a specific fuel type on a specific date
 * Falls back to the most recent available price if the date has no price
 */
export async function getFuelPrice(
	fuelType: FuelType,
	date: Date = new Date(),
): Promise<number | null> {
	const targetDate = new Date(date);
	targetDate.setHours(0, 0, 0, 0);

	// Try to get price for the exact date
	let price = await prisma.fuelPrice.findFirst({
		where: {
			fuelType,
			date: {
				lte: targetDate,
			},
		},
		orderBy: {
			date: "desc",
		},
	});

	if (!price) {
		// No price available - this shouldn't happen if system is properly maintained
		console.warn(
			`No fuel price found for ${fuelType} on or before ${targetDate}`,
		);
		return null;
	}

	return price.pricePerLiter;
}

/**
 * Get the latest prices for all fuel types
 */
export async function getLatestPrices() {
	const latestPrices = await prisma.fuelPrice.groupBy({
		by: ["fuelType"],
		_max: {
			date: true,
		},
	});

	const prices = await Promise.all(
		latestPrices.map(async (group) => {
			const price = await prisma.fuelPrice.findFirst({
				where: {
					fuelType: group.fuelType,
					date: group._max.date,
				},
			});
			return price;
		}),
	);

	return prices.filter((p) => p !== null);
}

/**
 * Calculate the quantity delivered for an amount-based order
 */
export async function calculateQuantityForAmount(
	amount: number,
	fuelType: FuelType,
	deliveryDate?: Date,
): Promise<number> {
	const pricePerLiter = await getFuelPrice(fuelType, deliveryDate);
	if (!pricePerLiter) {
		throw new Error(`No fuel price available for ${fuelType}`);
	}
	return amount / pricePerLiter;
}

/**
 * Calculate the amount for a quantity-based order
 */
export async function calculateAmountForQuantity(
	quantity: number,
	fuelType: FuelType,
	deliveryDate?: Date,
): Promise<number> {
	const pricePerLiter = await getFuelPrice(fuelType, deliveryDate);
	if (!pricePerLiter) {
		throw new Error(`No fuel price available for ${fuelType}`);
	}
	return quantity * pricePerLiter;
}

/**
 * Create an audit log for admin actions
 */
export async function createAuditLog(
	userId: string,
	action: string,
	tableName: string,
	recordId?: string,
	changes?: Record<string, unknown>,
) {
	return prisma.auditLog.create({
		data: {
			userId,
			action,
			tableName,
			recordId,
			changes: JSON.stringify(changes || {}),
		},
	});
}

/**
 * Get pending orders for an employee
 */
export async function getPendingOrders() {
	return prisma.order.findMany({
		where: {
			status: OrderStatus.PENDING,
		},
		include: {
			customer: {
				select: {
					id: true,
					fullName: true,
					phone: true,
					email: true,
				},
			},
		},
		orderBy: {
			createdAt: "asc",
		},
	});
}

/**
 * Get delivered orders ready for billing
 */
export async function getDeliveredOrdersForBilling() {
	return prisma.order.findMany({
		where: {
			status: OrderStatus.DELIVERED,
			bills: {
				none: {}, // Orders without bills
			},
		},
		include: {
			customer: {
				select: {
					id: true,
					fullName: true,
					phone: true,
					email: true,
				},
			},
		},
		orderBy: {
			deliveredAt: "asc",
		},
	});
}

/**
 * Get customer's orders
 */
export async function getCustomerOrders(customerId: string) {
	return prisma.order.findMany({
		where: {
			customerId,
		},
		include: {
			bills: true,
		},
		orderBy: {
			createdAt: "desc",
		},
	});
}

/**
 * Get all orders with optional filtering (for admin dashboard)
 */
export async function getAllOrders(
	filters: {
		status?: OrderStatus;
		fuelType?: FuelType;
		customerId?: string;
		limit?: number;
		offset?: number;
	} = {},
) {
	const { status, fuelType, customerId, limit = 20, offset = 0 } = filters;

	const where: any = {};
	if (status) where.status = status;
	if (fuelType) where.fuelType = fuelType;
	if (customerId) where.customerId = customerId;

	const [orders, total] = await Promise.all([
		prisma.order.findMany({
			where,
			include: {
				customer: {
					select: {
						id: true,
						fullName: true,
						phone: true,
						email: true,
					},
				},
				bills: true,
			},
			orderBy: {
				createdAt: "desc",
			},
			take: limit,
			skip: offset,
		}),
		prisma.order.count({ where }),
	]);

	return {
		orders,
		total,
		page: Math.floor(offset / limit) + 1,
		pageSize: limit,
		pages: Math.ceil(total / limit),
	};
}

/**
 * Update order status with audit logging
 */
export async function updateOrderStatus(
	orderId: string,
	newStatus: OrderStatus,
	adminId: string,
	additionalData?: { deliveredAt?: Date },
) {
	const order = await prisma.order.findUnique({
		where: { id: orderId },
	});

	if (!order) {
		throw new Error("Order not found");
	}

	const updated = await prisma.order.update({
		where: { id: orderId },
		data: {
			status: newStatus,
			...additionalData,
		},
	});

	// Create audit log
	await createAuditLog(adminId, "ORDER_STATUS_UPDATE", "orders", orderId, {
		from: order.status,
		to: newStatus,
		timestamp: new Date().toISOString(),
	});

	return updated;
}

/**
 * Disburse a cash advance for an order
 * Records when an employee receives cash before delivering fuel
 */
export async function disburseCashAdvance(
	orderId: string,
	employeeId: string,
	amount: number,
	description?: string,
) {
	// Verify order exists
	const order = await prisma.order.findUnique({
		where: { id: orderId },
	});

	if (!order) {
		throw new Error("Order not found");
	}

	// Record the cash advance transaction
	const transaction = await prisma.cashAdvanceTransaction.create({
		data: {
			orderId,
			employeeId,
			amount,
			transactionType: "DISBURSED",
			description: description || `Cash advance for order ${orderId}`,
		},
	});

	// Update order with cash advance amount
	await prisma.order.update({
		where: { id: orderId },
		data: {
			cashAdvance: amount,
		},
	});

	return transaction;
}

/**
 * Get cash advance summary for an employee
 * Shows total disbursed, reconciled, and outstanding amounts
 */
export async function getEmployeeCashAdvanceSummary(employeeId: string) {
	const transactions = await prisma.cashAdvanceTransaction.findMany({
		where: { employeeId },
		include: {
			employee: {
				select: {
					id: true,
					fullName: true,
					email: true,
				},
			},
		},
		orderBy: {
			createdAt: "desc",
		},
	});

	const disbursed = transactions
		.filter((t) => t.transactionType === "DISBURSED")
		.reduce((sum, t) => sum + t.amount, 0);

	const reconciled = transactions
		.filter((t) => t.transactionType === "RECONCILED")
		.reduce((sum, t) => sum + t.amount, 0);

	const outstanding = disbursed - reconciled;

	return {
		employeeId,
		employeeName: transactions[0]?.employee?.fullName || "Unknown",
		totalDisbursed: disbursed,
		totalReconciled: reconciled,
		outstandingAmount: outstanding,
		transactionCount: transactions.length,
		transactions,
	};
}

/**
 * Get all pending cash advances (not yet reconciled)
 */
export async function getPendingCashAdvances(limit: number = 100) {
	const pendingTransactions = await prisma.cashAdvanceTransaction.findMany({
		where: {
			transactionType: "DISBURSED",
			reconciliationBillId: null, // Not reconciled yet
		},
		include: {
			employee: {
				select: {
					id: true,
					fullName: true,
					email: true,
				},
			},
		},
		orderBy: {
			createdAt: "desc",
		},
		take: limit,
	});

	const totalOutstanding = pendingTransactions.reduce(
		(sum, t) => sum + t.amount,
		0,
	);

	return {
		pendingCount: pendingTransactions.length,
		totalOutstanding,
		transactions: pendingTransactions,
	};
}

/**
 * Reconcile cash advance against a bill
 * Links a cash advance transaction to a bill payment
 */
export async function reconcileCashAdvance(
	transactionId: string,
	billId: string,
	amount: number,
) {
	// Verify bill exists
	const bill = await prisma.bill.findUnique({
		where: { id: billId },
	});

	if (!bill) {
		throw new Error("Bill not found");
	}

	// Update transaction to mark as reconciled
	const transaction = await prisma.cashAdvanceTransaction.update({
		where: { id: transactionId },
		data: {
			transactionType: "RECONCILED",
			reconciliationBillId: billId,
			description: `Reconciled against bill ${billId}`,
		},
	});

	return transaction;
}

/**
 * Get cash advance report for admin dashboard
 * Aggregates daily cash advances and reconciliations
 */
export async function getCashAdvanceReport(startDate: Date, endDate: Date) {
	const transactions = await prisma.cashAdvanceTransaction.findMany({
		where: {
			createdAt: {
				gte: startDate,
				lte: endDate,
			},
		},
		include: {
			employee: {
				select: {
					id: true,
					fullName: true,
				},
			},
		},
		orderBy: {
			createdAt: "desc",
		},
	});

	const disbursements = transactions.filter(
		(t) => t.transactionType === "DISBURSED",
	);
	const reconciliations = transactions.filter(
		(t) => t.transactionType === "RECONCILED",
	);

	const totalDisbursed = disbursements.reduce((sum, t) => sum + t.amount, 0);
	const totalReconciled = reconciliations.reduce((sum, t) => sum + t.amount, 0);

	// Group by employee
	const byEmployee: { [key: string]: any } = {};
	disbursements.forEach((t) => {
		if (!byEmployee[t.employeeId]) {
			byEmployee[t.employeeId] = {
				employeeId: t.employeeId,
				employeeName: t.employee?.fullName,
				disbursed: 0,
				reconciled: 0,
				outstanding: 0,
			};
		}
		byEmployee[t.employeeId].disbursed += t.amount;
	});

	reconciliations.forEach((t) => {
		if (byEmployee[t.employeeId]) {
			byEmployee[t.employeeId].reconciled += t.amount;
		}
	});

	Object.keys(byEmployee).forEach((empId) => {
		byEmployee[empId].outstanding =
			byEmployee[empId].disbursed - byEmployee[empId].reconciled;
	});

	return {
		period: {
			startDate,
			endDate,
		},
		summary: {
			totalDisbursed,
			totalReconciled,
			totalOutstanding: totalDisbursed - totalReconciled,
		},
		byEmployee: Object.values(byEmployee),
		transactionCount: transactions.length,
	};
}

/**
 * Set daily fuel price
 * Ensures only one price per fuel type per day
 * Returns error if price already set for the day
 */
export async function setDailyPrice(
	fuelType: FuelType,
	pricePerLiter: number,
	adminId: string,
	date: Date = new Date(),
) {
	// Set date to start of day (ignore time)
	const targetDate = new Date(date);
	targetDate.setHours(0, 0, 0, 0);

	// Check if price already exists for today
	const existingPrice = await prisma.fuelPrice.findFirst({
		where: {
			fuelType,
			date: {
				gte: targetDate,
				lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000),
			},
		},
	});

	if (existingPrice) {
		throw new Error(
			`Price for ${fuelType} already set today. Cannot set multiple prices in a 24-hour period.`,
		);
	}

	// Create new price entry
	const newPrice = await prisma.fuelPrice.create({
		data: {
			fuelType,
			pricePerLiter,
			date: targetDate,
			createdByAdminId: adminId,
		},
	});

	// Log audit
	await createAuditLog(adminId, "PRICE_SET", "fuel_prices", newPrice.id, {
		fuelType,
		pricePerLiter,
		date: targetDate.toISOString(),
	});

	return newPrice;
}

/**
 * Update daily fuel price
 * Only admin can update within the same day (before 24 hours pass)
 */
export async function updateDailyPrice(
	priceId: string,
	newPricePerLiter: number,
	adminId: string,
) {
	const price = await prisma.fuelPrice.findUnique({
		where: { id: priceId },
	});

	if (!price) {
		throw new Error("Price record not found");
	}

	// Check if we're still within the same day
	const now = new Date();
	const priceDate = new Date(price.date);
	const dayAfter = new Date(priceDate.getTime() + 24 * 60 * 60 * 1000);

	if (now > dayAfter) {
		throw new Error(
			"Cannot update price. 24-hour period has passed. Use setDailyPrice for a new day.",
		);
	}

	const oldPrice = price.pricePerLiter;

	const updated = await prisma.fuelPrice.update({
		where: { id: priceId },
		data: {
			pricePerLiter: newPricePerLiter,
		},
	});

	// Log audit
	await createAuditLog(adminId, "PRICE_UPDATE", "fuel_prices", priceId, {
		fuelType: price.fuelType,
		oldPrice,
		newPrice: newPricePerLiter,
		date: price.date.toISOString(),
	});

	return updated;
}

/**
 * Get price history for a fuel type
 * Shows how price has changed over time
 */
export async function getPriceHistory(fuelType: FuelType, days: number = 30) {
	const startDate = new Date();
	startDate.setDate(startDate.getDate() - days);

	const history = await prisma.fuelPrice.findMany({
		where: {
			fuelType,
			date: {
				gte: startDate,
			},
		},
		orderBy: {
			date: "desc",
		},
	});

	return history;
}

/**
 * Check if price needs to be updated (last update was > 24 hours ago)
 */
export async function shouldUpdatePrice(fuelType: FuelType): Promise<boolean> {
	const lastPrice = await prisma.fuelPrice.findFirst({
		where: { fuelType },
		orderBy: {
			date: "desc",
		},
	});

	if (!lastPrice) {
		return true; // No price exists
	}

	const now = new Date();
	const lastPriceDate = new Date(lastPrice.date);
	const hoursSinceUpdate =
		(now.getTime() - lastPriceDate.getTime()) / (1000 * 60 * 60);

	return hoursSinceUpdate >= 24;
}

/**
 * Get all fuel types that need price updates
 * Returns fuel types where last update was > 24 hours ago
 */
export async function getFuelTypesThatNeedPriceUpdate(): Promise<FuelType[]> {
	const fuelTypes: FuelType[] = ["PETROL", "DIESEL"];
	const needsUpdate: FuelType[] = [];

	for (const fuelType of fuelTypes) {
		const needsUpdateFlag = await shouldUpdatePrice(fuelType);
		if (needsUpdateFlag) {
			needsUpdate.push(fuelType);
		}
	}

	return needsUpdate;
}

/**
 * Get price update status for dashboard
 * Shows status of each fuel type and when last updated
 */
export async function getPriceUpdateStatus() {
	const fuelTypes: FuelType[] = ["PETROL", "DIESEL"];

	const status = await Promise.all(
		fuelTypes.map(async (fuelType) => {
			const lastPrice = await prisma.fuelPrice.findFirst({
				where: { fuelType },
				orderBy: {
					date: "desc",
				},
			});

			if (!lastPrice) {
				return {
					fuelType,
					currentPrice: null,
					lastUpdated: null,
					needsUpdate: true,
					hoursOverdue: null,
				};
			}

			const now = new Date();
			const lastUpdateDate = new Date(lastPrice.date);
			const hoursSinceUpdate =
				(now.getTime() - lastUpdateDate.getTime()) / (1000 * 60 * 60);
			const needsUpdate = hoursSinceUpdate >= 24;
			const hoursOverdue = needsUpdate ? Math.round(hoursSinceUpdate - 24) : 0;

			return {
				fuelType,
				currentPrice: lastPrice.pricePerLiter,
				lastUpdated: lastPrice.date,
				needsUpdate,
				hoursOverdue,
			};
		}),
	);

	return status;
}
