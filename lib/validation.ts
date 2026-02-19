import { z } from "zod";

// Authentication schemas
export const SignupSchema = z.object({
	email: z.string().email("Invalid email address"),
	password: z.string().min(8, "Password must be at least 8 characters"),
	fullName: z.string().min(2, "Full name is required"),
	phone: z
		.string()
		.regex(/^\d{10}$/, "Phone number must be 10 digits")
		.optional(),
	role: z.enum(["CUSTOMER", "EMPLOYEE"]).default("CUSTOMER"),
});

export const LoginSchema = z.object({
	email: z.string().email("Invalid email address"),
	password: z.string(),
});

// Order schemas
export const CreateOrderSchema = z
	.object({
		vehicleNumber: z.string().min(1, "Vehicle number is required"),
		fuelType: z.enum(["PETROL", "DIESEL"]),
		amountRequested: z.number().positive("Amount must be positive").optional(),
		quantityRequested: z
			.number()
			.positive("Quantity must be positive")
			.optional(),
		cashAdvance: z
			.number()
			.min(0, "Cash advance cannot be negative")
			.default(0),
	})
	.refine((data) => data.amountRequested || data.quantityRequested, {
		message: "Either amount or quantity must be specified",
		path: ["amountRequested"],
	})
	.refine((data) => !(data.amountRequested && data.quantityRequested), {
		message: "Cannot specify both amount and quantity",
		path: ["amountRequested"],
	});

export const UpdateOrderStatusSchema = z.object({
	status: z.enum(["PENDING", "DELIVERED", "BILLED", "PAID"]),
	deliveredAt: z.date().optional(),
});

export const MarkOrderDeliveredSchema = z.object({
	quantityDelivered: z.number().positive("Quantity delivered must be positive"),
});

// Price schemas
export const SetFuelPriceSchema = z.object({
	fuelType: z.enum(["PETROL", "DIESEL"]),
	pricePerLiter: z.number().positive("Price must be positive"),
	date: z.date().optional(), // Defaults to today
});

// Bill schemas
export const CreateBillSchema = z.object({
	orderId: z.string().uuid("Invalid order ID"),
	quantityDelivered: z.number().positive("Quantity must be positive"),
	adjustments: z.number().default(0),
});

export const MarkBillPaidSchema = z.object({
	paymentMethod: z.enum(["CASH", "CARD", "UPI", "CHEQUE"]).optional(),
	notes: z.string().optional(),
});

// Pagination schema
export const PaginationSchema = z.object({
	limit: z.number().int().min(1).max(100).default(20),
	offset: z.number().int().min(0).default(0),
});

// Filter schemas
export const OrderFilterSchema = z.object({
	status: z.enum(["PENDING", "DELIVERED", "BILLED", "PAID"]).optional(),
	fuelType: z.enum(["PETROL", "DIESEL"]).optional(),
	customerId: z.string().optional(),
	limit: z.number().int().min(1).max(100).default(20),
	offset: z.number().int().min(0).default(0),
});

export const BillFilterSchema = z.object({
	status: z.enum(["PENDING", "BILLED", "PAID"]).optional(),
	limit: z.number().int().min(1).max(100).default(20),
	offset: z.number().int().min(0).default(0),
});

// Type exports for use in API routes
export type SignupInput = z.infer<typeof SignupSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;
export type MarkOrderDeliveredInput = z.infer<typeof MarkOrderDeliveredSchema>;
export type SetFuelPriceInput = z.infer<typeof SetFuelPriceSchema>;
export type CreateBillInput = z.infer<typeof CreateBillSchema>;
export type MarkBillPaidInput = z.infer<typeof MarkBillPaidSchema>;
export type OrderFilterInput = z.infer<typeof OrderFilterSchema>;
export type BillFilterInput = z.infer<typeof BillFilterSchema>;
