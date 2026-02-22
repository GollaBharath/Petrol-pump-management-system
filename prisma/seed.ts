import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

// Load environment variables
config({ path: ".env" });
config({ path: ".env.local" });

const prisma = new PrismaClient();
const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/** Create or find a Supabase Auth user and upsert the DB record. Returns the DB user. */
async function upsertUser(opts: {
	email: string;
	password: string;
	fullName: string;
	phone?: string;
	role: "ADMIN" | "EMPLOYEE" | "CUSTOMER";
}) {
	let supabaseId: string;

	const { data: created, error: createErr } =
		await supabase.auth.admin.createUser({
			email: opts.email,
			password: opts.password,
			email_confirm: true,
		});

	if (createErr) {
		if (
			createErr.message?.includes("already been registered") ||
			(createErr as any).code === "email_exists"
		) {
			// Already in Supabase Auth — look up the existing ID
			const { data: list, error: listErr } =
				await supabase.auth.admin.listUsers();
			if (listErr) throw listErr;
			const existing = list.users.find((u) => u.email === opts.email);
			if (!existing) throw new Error(`Cannot find Supabase user for ${opts.email}`);
			supabaseId = existing.id;
			// Ensure password matches
			await supabase.auth.admin.updateUserById(supabaseId, {
				password: opts.password,
			});
		} else {
			throw createErr;
		}
	} else {
		supabaseId = created.user.id;
	}

	const user = await prisma.user.upsert({
		where: { id: supabaseId },
		update: { role: opts.role, fullName: opts.fullName, phone: opts.phone ?? null },
		create: {
			id: supabaseId,
			email: opts.email,
			fullName: opts.fullName,
			phone: opts.phone ?? null,
			role: opts.role,
		},
	});

	return user;
}

async function seed() {
	console.log("🌱 Starting database seed...");

	try {
		const admin = await upsertUser({
			email: "admin@petrolpump.com",
			password: "admin123",
			fullName: "Admin User",
			phone: "9999999999",
			role: "ADMIN",
		});
		console.log("✅ Admin created:", admin.id);

		const employee = await upsertUser({
			email: "employee@petrolpump.com",
			password: "employee123",
			fullName: "Employee User",
			phone: "9888888888",
			role: "EMPLOYEE",
		});
		console.log("✅ Employee created:", employee.id);

		const customer1 = await upsertUser({
			email: "customer1@petrolpump.com",
			password: "customer123",
			fullName: "Rajesh Kumar",
			phone: "9876543210",
			role: "CUSTOMER",
		});
		console.log("✅ Customer 1 created:", customer1.id);

		const customer2 = await upsertUser({
			email: "customer2@petrolpump.com",
			password: "customer123",
			fullName: "Priya Singh",
			phone: "9765432109",
			role: "CUSTOMER",
		});
		console.log("✅ Customer 2 created:", customer2.id);

		// Fuel prices
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const petrolPrice = await prisma.fuelPrice.upsert({
			where: { fuelType_date: { fuelType: "PETROL", date: today } },
			update: {},
			create: {
				fuelType: "PETROL",
				pricePerLiter: 105.5,
				date: today,
				createdByAdminId: admin.id,
			},
		});
		console.log("✅ Petrol price:", petrolPrice.id);

		const dieselPrice = await prisma.fuelPrice.upsert({
			where: { fuelType_date: { fuelType: "DIESEL", date: today } },
			update: {},
			create: {
				fuelType: "DIESEL",
				pricePerLiter: 94.25,
				date: today,
				createdByAdminId: admin.id,
			},
		});
		console.log("✅ Diesel price:", dieselPrice.id);

		// Sample orders
		const order1 = await prisma.order.create({
			data: {
				customerId: customer1.id,
				vehicleNumber: "DL01AB1234",
				fuelType: "PETROL",
				quantityRequested: 50,
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
				amountRequested: 5000,
				cashAdvance: 1500,
				status: "DELIVERED",
				deliveredAt: new Date(),
			},
		});
		console.log("✅ Order 2 created:", order2.id);

		// Bill for delivered order
		const bill = await prisma.bill.create({
			data: {
				orderId: order2.id,
				quantityDelivered: 53.0,
				pricePerLiter: dieselPrice.pricePerLiter,
				totalAmount: 5000,
				cashAdvance: 1500,
				netAmount: 6500,
				status: "PENDING",
			},
		});
		console.log("✅ Bill created:", bill.id);

		console.log("\n🎉 Database seed completed successfully!");
		console.log("\n📊 Seeded accounts (all can login):");
		console.log("   admin@petrolpump.com      / admin123     (ADMIN)");
		console.log("   employee@petrolpump.com   / employee123  (EMPLOYEE)");
		console.log("   customer1@petrolpump.com  / customer123  (CUSTOMER)");
		console.log("   customer2@petrolpump.com  / customer123  (CUSTOMER)");
	} catch (error) {
		console.error("❌ Seed failed:", error);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

seed();
