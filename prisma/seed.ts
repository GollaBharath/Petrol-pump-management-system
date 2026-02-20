import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";

// Load environment variables from .env.local
config({ path: ".env.local" });

const prisma = new PrismaClient();

async function seed() {
	console.log("🌱 Starting database seed...");

	try {
		// Create admin user
		const admin = await prisma.user.upsert({
			where: { email: "admin@petrompump.local" },
			update: {},
			create: {
				email: "admin@petrompump.local",
				fullName: "Admin User",
				phone: "9999999999",
				role: "ADMIN",
			},
		});
		console.log("✅ Admin user created:", admin.id);

		// Create employee user
		const employee = await prisma.user.upsert({
			where: { email: "employee@petrompump.local" },
			update: {},
			create: {
				email: "employee@petrompump.local",
				fullName: "Employee User",
				phone: "9888888888",
				role: "EMPLOYEE",
			},
		});
		console.log("✅ Employee user created:", employee.id);

		// Create customer users
		const customer1 = await prisma.user.upsert({
			where: { email: "customer1@petrompump.local" },
			update: {},
			create: {
				email: "customer1@petrompump.local",
				fullName: "Rajesh Kumar",
				phone: "9876543210",
				role: "CUSTOMER",
			},
		});
		console.log("✅ Customer 1 created:", customer1.id);

		const customer2 = await prisma.user.upsert({
			where: { email: "customer2@petrompump.local" },
			update: {},
			create: {
				email: "customer2@petrompump.local",
				fullName: "Priya Singh",
				phone: "9765432109",
				role: "CUSTOMER",
			},
		});
		console.log("✅ Customer 2 created:", customer2.id);

		// Create fuel prices for today
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const petrolPrice = await prisma.fuelPrice.upsert({
			where: {
				fuelType_date: {
					fuelType: "PETROL",
					date: today,
				},
			},
			update: {},
			create: {
				fuelType: "PETROL",
				pricePerLiter: 105.5,
				date: today,
				createdByAdminId: admin.id,
			},
		});
		console.log("✅ Petrol price created:", petrolPrice.id);

		const dieselPrice = await prisma.fuelPrice.upsert({
			where: {
				fuelType_date: {
					fuelType: "DIESEL",
					date: today,
				},
			},
			update: {},
			create: {
				fuelType: "DIESEL",
				pricePerLiter: 94.25,
				date: today,
				createdByAdminId: admin.id,
			},
		});
		console.log("✅ Diesel price created:", dieselPrice.id);

		// Create sample orders
		const order1 = await prisma.order.create({
			data: {
				customerId: customer1.id,
				vehicleNumber: "DL01AB1234",
				fuelType: "PETROL",
				quantityRequested: 50, // 50 liters
				cashAdvance: 2000,
				status: "PENDING",
			},
		});
		console.log("✅ Order 1 created:", order1.id);

		const order2 = await prisma.order.create({
			data: {
				customerId: customer2.id,
				vehicleNumber: "DL01CD5678",
				fuelType: "DIESEL",
				amountRequested: 5000, // 5000 INR worth
				cashAdvance: 1500,
				status: "DELIVERED",
				deliveredAt: new Date(),
			},
		});
		console.log("✅ Order 2 created:", order2.id);

		// Create a bill for the delivered order
		const bill = await prisma.bill.create({
			data: {
				orderId: order2.id,
				quantityDelivered: 53.0, // 5000 / 94.25 ≈ 53 liters
				pricePerLiter: dieselPrice.pricePerLiter,
				totalAmount: 5000,
				cashAdvance: 1500,
				netAmount: 6500, // 5000 + 1500 (cash advance)
				status: "PENDING",
			},
		});
		console.log("✅ Bill created:", bill.id);

		// Create audit log
		const auditLog = await prisma.auditLog.create({
			data: {
				userId: admin.id,
				action: "DATABASE_SEED",
				tableName: "all",
				changes: JSON.stringify({
					message: "Initial database seed with test data",
					timestamp: new Date().toISOString(),
				}),
			},
		});
		console.log("✅ Audit log created:", auditLog.id);

		console.log("\n🎉 Database seed completed successfully!");
		console.log("\n📊 Summary:");
		console.log("   - 1 Admin user");
		console.log("   - 1 Employee user");
		console.log("   - 2 Customer users");
		console.log("   - 2 Fuel prices (Petrol & Diesel)");
		console.log("   - 2 Sample orders");
		console.log("   - 1 Bill");
		console.log("\n✨ You can now start developing!");
	} catch (error) {
		console.error("❌ Seed failed:", error);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

seed();
