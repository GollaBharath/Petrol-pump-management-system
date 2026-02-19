/**
 * Real-time Order Tracking with Supabase Subscriptions
 *
 * Provides real-time order status updates using Supabase PostGres Changes
 * Enables live tracking across customer app, employee app, and admin dashboard
 */

import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client for real-time subscriptions
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Order Status Change Event
 */
export interface OrderStatusChangeEvent {
	id: string;
	orderId: string;
	previousStatus: "PENDING" | "DELIVERED" | "CANCELLED";
	newStatus: "PENDING" | "DELIVERED" | "CANCELLED";
	changedAt: string;
	changedBy: string;
	quantityDelivered?: number;
}

/**
 * Subscribe to order status changes for a specific order
 * Useful for customer app to track their order in real-time
 */
export function subscribeToOrderUpdates(
	orderId: string,
	onUpdate: (order: any) => void,
	onError?: (error: Error) => void,
) {
	const subscription = supabase
		.channel(`order:${orderId}`)
		.on(
			"postgres_changes",
			{
				event: "UPDATE",
				schema: "public",
				table: "orders",
				filter: `id=eq.${orderId}`,
			},
			(payload) => {
				onUpdate(payload.new);
			},
		)
		.on("error", (error) => {
			if (onError) {
				onError(new Error(`Real-time subscription error: ${error.message}`));
			}
		})
		.subscribe();

	return subscription;
}

/**
 * Subscribe to all pending orders for an employee
 * Useful for employee app to get real-time order assignments
 */
export function subscribeToPendingOrders(
	employeeId: string,
	onUpdate: (orders: any[]) => void,
	onError?: (error: Error) => void,
) {
	const subscription = supabase
		.channel(`pending_orders:${employeeId}`)
		.on(
			"postgres_changes",
			{
				event: "*",
				schema: "public",
				table: "orders",
				filter: `status=eq.PENDING`,
			},
			(payload) => {
				// Trigger re-fetch of pending orders
				onUpdate(payload);
			},
		)
		.on("error", (error) => {
			if (onError) {
				onError(new Error(`Real-time subscription error: ${error.message}`));
			}
		})
		.subscribe();

	return subscription;
}

/**
 * Subscribe to all order changes for admin dashboard
 * Useful for real-time dashboard updates
 */
export function subscribeToAllOrderChanges(
	onInsert?: (order: any) => void,
	onUpdate?: (order: any) => void,
	onDelete?: (order: any) => void,
	onError?: (error: Error) => void,
) {
	const subscription = supabase
		.channel("all_orders")
		.on(
			"postgres_changes",
			{
				event: "INSERT",
				schema: "public",
				table: "orders",
			},
			(payload) => {
				if (onInsert) onInsert(payload.new);
			},
		)
		.on(
			"postgres_changes",
			{
				event: "UPDATE",
				schema: "public",
				table: "orders",
			},
			(payload) => {
				if (onUpdate) onUpdate(payload.new);
			},
		)
		.on(
			"postgres_changes",
			{
				event: "DELETE",
				schema: "public",
				table: "orders",
			},
			(payload) => {
				if (onDelete) onDelete(payload.old);
			},
		)
		.on("error", (error) => {
			if (onError) {
				onError(new Error(`Real-time subscription error: ${error.message}`));
			}
		})
		.subscribe();

	return subscription;
}

/**
 * Subscribe to bill status changes
 * Useful for tracking payment status in real-time
 */
export function subscribeToBillUpdates(
	billId: string,
	onUpdate: (bill: any) => void,
	onError?: (error: Error) => void,
) {
	const subscription = supabase
		.channel(`bill:${billId}`)
		.on(
			"postgres_changes",
			{
				event: "UPDATE",
				schema: "public",
				table: "bills",
				filter: `id=eq.${billId}`,
			},
			(payload) => {
				onUpdate(payload.new);
			},
		)
		.on("error", (error) => {
			if (onError) {
				onError(new Error(`Real-time subscription error: ${error.message}`));
			}
		})
		.subscribe();

	return subscription;
}

/**
 * Subscribe to cash advance status changes
 * Useful for tracking cash advance reconciliation
 */
export function subscribeToCashAdvanceUpdates(
	employeeId: string,
	onUpdate: (advance: any) => void,
	onError?: (error: Error) => void,
) {
	const subscription = supabase
		.channel(`cash_advances:${employeeId}`)
		.on(
			"postgres_changes",
			{
				event: "UPDATE",
				schema: "public",
				table: "cash_advance_transactions",
				filter: `employeeId=eq.${employeeId}`,
			},
			(payload) => {
				onUpdate(payload.new);
			},
		)
		.on("error", (error) => {
			if (onError) {
				onError(new Error(`Real-time subscription error: ${error.message}`));
			}
		})
		.subscribe();

	return subscription;
}

/**
 * Subscribe to price updates
 * Useful for updating prices in real-time across all clients
 */
export function subscribeToPriceUpdates(
	fuelType: string,
	onUpdate: (price: any) => void,
	onError?: (error: Error) => void,
) {
	const subscription = supabase
		.channel(`prices:${fuelType}`)
		.on(
			"postgres_changes",
			{
				event: "INSERT",
				schema: "public",
				table: "fuel_prices",
				filter: `fuelType=eq.${fuelType}`,
			},
			(payload) => {
				onUpdate(payload.new);
			},
		)
		.on(
			"postgres_changes",
			{
				event: "UPDATE",
				schema: "public",
				table: "fuel_prices",
				filter: `fuelType=eq.${fuelType}`,
			},
			(payload) => {
				onUpdate(payload.new);
			},
		)
		.on("error", (error) => {
			if (onError) {
				onError(new Error(`Real-time subscription error: ${error.message}`));
			}
		})
		.subscribe();

	return subscription;
}

/**
 * Unsubscribe from a real-time channel
 */
export async function unsubscribeFromChannel(subscription: any) {
	if (subscription) {
		await supabase.removeChannel(subscription);
	}
}

/**
 * Get all active subscriptions
 */
export function getActiveSubscriptions() {
	return supabase.getChannels();
}
