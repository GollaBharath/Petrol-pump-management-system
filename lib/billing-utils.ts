/**
 * Billing System with Price-Aware Calculations
 *
 * Handles bill generation and calculation based on:
 * - Quantity delivered (or amount converted at delivery price)
 * - Price on the day of delivery
 * - Cash advance given to driver
 * - Final settlement amount due from customer
 */

import { prisma } from "@/lib/prisma";

export interface BillCalculation {
	orderId: string;
	customerId: string;
	fuelType: string;
	quantityDelivered: number;
	pricePerLiterAtDelivery: number;
	totalAmount: number;
	cashAdvanceAmount: number;
	settlementAmount: number;
	generatedAt: string;
}

/**
 * Calculate bill amount based on delivery quantity and price
 * Converts amount-based orders to quantity using delivery price
 */
export async function calculateBillAmount(
	orderId: string,
): Promise<BillCalculation> {
	// Fetch order with customer and delivery details
	const order = await prisma.order.findUnique({
		where: { id: orderId },
		include: {
			customer: true,
			cashAdvance: true,
		},
	});

	if (!order) {
		throw new Error(`Order not found: ${orderId}`);
	}

	if (order.status !== "DELIVERED" || !order.deliveredAt) {
		throw new Error(
			`Order must be delivered before bill generation: ${orderId}`,
		);
	}

	// Get the price on delivery date
	const deliveryDate = order.deliveredAt;
	const priceRecord = await prisma.fuelPrice.findFirst({
		where: {
			fuelType: order.fuelType,
			date: {
				lte: deliveryDate,
			},
		},
		orderBy: {
			date: "desc",
		},
	});

	if (!priceRecord) {
		throw new Error(
			`No price record found for ${order.fuelType} on or before ${deliveryDate.toISOString()}`,
		);
	}

	const pricePerLiter = priceRecord.pricePerLiter;

	// Calculate quantity delivered
	let quantityDelivered: number;
	if (order.quantityOrdered) {
		// Quantity-based order
		quantityDelivered = order.quantityOrdered;
	} else if (order.amountOrdered) {
		// Amount-based order: convert to quantity using delivery price
		quantityDelivered = order.amountOrdered / pricePerLiter;
	} else {
		throw new Error(`Order has neither quantity nor amount: ${orderId}`);
	}

	// Calculate total amount
	const totalAmount = quantityDelivered * pricePerLiter;

	// Get cash advance amount
	const cashAdvanceAmount = order.cashAdvance?.amount || 0;

	// Calculate settlement amount (what customer owes)
	const settlementAmount = totalAmount - cashAdvanceAmount;

	return {
		orderId: order.id,
		customerId: order.customerId,
		fuelType: order.fuelType,
		quantityDelivered,
		pricePerLiterAtDelivery: pricePerLiter,
		totalAmount,
		cashAdvanceAmount,
		settlementAmount,
		generatedAt: new Date().toISOString(),
	};
}

/**
 * Generate a bill for a delivered order
 * Automatically calculates all amounts and creates bill record
 */
export async function generateBill(orderId: string, createdBy: string) {
	// Calculate bill details
	const calculation = await calculateBillAmount(orderId);

	// Check if bill already exists
	const existingBill = await prisma.bill.findFirst({
		where: { orderId },
	});

	if (existingBill) {
		throw new Error(`Bill already exists for order ${orderId}`);
	}

	// Get cash advance transaction ID if exists
	const cashAdvanceTransaction = await prisma.cashAdvanceTransaction.findFirst({
		where: {
			orderId: orderId,
			type: "DISBURSED",
		},
	});

	// Create bill
	const bill = await prisma.bill.create({
		data: {
			orderId: calculation.orderId,
			customerId: calculation.customerId,
			quantityDelivered: calculation.quantityDelivered,
			pricePerLiterAtDelivery: calculation.pricePerLiterAtDelivery,
			totalAmount: calculation.totalAmount,
			cashAdvanceAmount: calculation.cashAdvanceAmount,
			settlementAmount: calculation.settlementAmount,
			status: "PENDING",
			createdBy: createdBy,
			cashAdvanceId: cashAdvanceTransaction?.id,
		},
		include: {
			order: {
				select: {
					customer: true,
					fuelType: true,
				},
			},
		},
	});

	// Log audit entry
	await prisma.auditLog.create({
		data: {
			action: "BILL_GENERATED",
			resource: "Bill",
			resourceId: bill.id,
			performedBy: createdBy,
			details: {
				orderId,
				totalAmount: calculation.totalAmount,
				settlementAmount: calculation.settlementAmount,
			},
		},
	});

	return bill;
}

/**
 * Mark a bill as paid
 */
export async function markBillAsPaid(
	billId: string,
	paidBy: string,
	paymentMethod: string = "CASH",
) {
	const bill = await prisma.bill.findUnique({
		where: { id: billId },
	});

	if (!bill) {
		throw new Error(`Bill not found: ${billId}`);
	}

	if (bill.status === "PAID") {
		throw new Error(`Bill is already paid: ${billId}`);
	}

	// Update bill status
	const updatedBill = await prisma.bill.update({
		where: { id: billId },
		data: {
			status: "PAID",
			paidAt: new Date(),
			paymentMethod,
		},
		include: {
			order: {
				select: {
					customer: true,
					fuelType: true,
				},
			},
		},
	});

	// Log audit entry
	await prisma.auditLog.create({
		data: {
			action: "BILL_PAID",
			resource: "Bill",
			resourceId: billId,
			performedBy: paidBy,
			details: {
				paymentMethod,
				amount: bill.settlementAmount,
			},
		},
	});

	// If cash advance was used, update it as reconciled
	if (bill.cashAdvanceId) {
		await prisma.cashAdvanceTransaction.update({
			where: { id: bill.cashAdvanceId },
			data: {
				type: "RECONCILED",
				billId: billId,
			},
		});
	}

	return updatedBill;
}

/**
 * Get bill details with all related information
 */
export async function getBillDetails(billId: string) {
	const bill = await prisma.bill.findUnique({
		where: { id: billId },
		include: {
			order: {
				select: {
					id: true,
					customerId: true,
					fuelType: true,
					quantityOrdered: true,
					amountOrdered: true,
					status: true,
					createdAt: true,
					deliveredAt: true,
				},
			},
			customer: {
				select: {
					id: true,
					name: true,
					email: true,
					phone: true,
				},
			},
			cashAdvance: true,
		},
	});

	if (!bill) {
		throw new Error(`Bill not found: ${billId}`);
	}

	return bill;
}

/**
 * Get all pending bills (awaiting payment)
 */
export async function getPendingBills(limit: number = 50, offset: number = 0) {
	const [bills, total] = await Promise.all([
		prisma.bill.findMany({
			where: { status: "PENDING" },
			include: {
				customer: {
					select: {
						name: true,
						email: true,
					},
				},
				order: {
					select: {
						id: true,
						fuelType: true,
					},
				},
			},
			orderBy: { createdAt: "desc" },
			take: limit,
			skip: offset,
		}),
		prisma.bill.count({ where: { status: "PENDING" } }),
	]);

	return {
		bills,
		total,
		page: Math.floor(offset / limit) + 1,
		pageSize: limit,
	};
}

/**
 * Get all overdue bills (past due date)
 */
export async function getOverdueBills(limit: number = 50, offset: number = 0) {
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const [bills, total] = await Promise.all([
		prisma.bill.findMany({
			where: {
				status: "PENDING",
				dueDate: {
					lt: today,
				},
			},
			include: {
				customer: {
					select: {
						name: true,
						email: true,
					},
				},
				order: {
					select: {
						id: true,
						fuelType: true,
					},
				},
			},
			orderBy: { dueDate: "asc" },
			take: limit,
			skip: offset,
		}),
		prisma.bill.count({
			where: {
				status: "PENDING",
				dueDate: {
					lt: today,
				},
			},
		}),
	]);

	return {
		bills,
		total,
		page: Math.floor(offset / limit) + 1,
		pageSize: limit,
	};
}

/**
 * Get bills for a specific customer
 */
export async function getCustomerBills(
	customerId: string,
	limit: number = 50,
	offset: number = 0,
) {
	const [bills, total] = await Promise.all([
		prisma.bill.findMany({
			where: { customerId },
			include: {
				order: {
					select: {
						id: true,
						fuelType: true,
						quantityOrdered: true,
						amountOrdered: true,
					},
				},
			},
			orderBy: { createdAt: "desc" },
			take: limit,
			skip: offset,
		}),
		prisma.bill.count({ where: { customerId } }),
	]);

	return {
		bills,
		total,
		page: Math.floor(offset / limit) + 1,
		pageSize: limit,
	};
}

/**
 * Get billing summary for a date range
 */
export async function getBillingReport(startDate: Date, endDate: Date) {
	const bills = await prisma.bill.findMany({
		where: {
			createdAt: {
				gte: startDate,
				lte: endDate,
			},
		},
	});

	const totalBills = bills.length;
	const paidBills = bills.filter((b) => b.status === "PAID").length;
	const pendingBills = bills.filter((b) => b.status === "PENDING").length;

	const totalRevenue = bills.reduce((sum, bill) => sum + bill.totalAmount, 0);
	const totalSettled = bills
		.filter((b) => b.status === "PAID")
		.reduce((sum, bill) => sum + bill.settlementAmount, 0);
	const totalOutstanding = bills
		.filter((b) => b.status === "PENDING")
		.reduce((sum, bill) => sum + bill.settlementAmount, 0);

	const averageBillAmount = totalBills > 0 ? totalRevenue / totalBills : 0;

	return {
		period: {
			start: startDate.toISOString().split("T")[0],
			end: endDate.toISOString().split("T")[0],
		},
		totalBills,
		paidBills,
		pendingBills,
		totalRevenue,
		totalSettled,
		totalOutstanding,
		averageBillAmount,
		paymentRate: totalBills > 0 ? (paidBills / totalBills) * 100 : 0,
	};
}

/**
 * Auto-generate bills for all delivered orders without bills
 * Run this periodically or after orders are marked delivered
 */
export async function autoGenerateMissingBills(createdBy: string) {
	// Find all delivered orders without bills
	const ordersNeedingBills = await prisma.order.findMany({
		where: {
			status: "DELIVERED",
			bill: null,
		},
		select: { id: true },
	});

	const results = {
		total: ordersNeedingBills.length,
		success: 0,
		failed: 0,
		errors: [] as Array<{ orderId: string; error: string }>,
	};

	for (const order of ordersNeedingBills) {
		try {
			await generateBill(order.id, createdBy);
			results.success++;
		} catch (error) {
			results.failed++;
			results.errors.push({
				orderId: order.id,
				error: error instanceof Error ? error.message : "Unknown error",
			});
		}
	}

	return results;
}
