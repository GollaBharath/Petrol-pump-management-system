require("dotenv").config({ path: ".env" });
const { createClient } = require("@supabase/supabase-js");
const { PrismaClient } = require("@prisma/client");

const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL,
	process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const prisma = new PrismaClient();

async function createAdminUser() {
	const email = "admin@petrolpump.com";
	const password = "admin123";
	const fullName = "Admin User";

	console.log("Setting up admin user...");

	try {
		let supabaseUserId;

		// Try to create the Supabase Auth user
		const { data: createData, error: createError } =
			await supabase.auth.admin.createUser({
				email,
				password,
				email_confirm: true,
			});

		if (createError) {
			if (
				createError.message?.includes("already been registered") ||
				createError.code === "email_exists"
			) {
				// User already exists in Supabase Auth — look up their ID
				console.log("Auth user already exists, looking up ID...");
				const { data: listData, error: listError } =
					await supabase.auth.admin.listUsers();
				if (listError) throw listError;
				const existing = listData.users.find((u) => u.email === email);
				if (!existing) {
					console.error("Could not find existing Supabase auth user");
					return;
				}
				supabaseUserId = existing.id;

				// Update password to ensure it matches
				const { error: pwError } = await supabase.auth.admin.updateUserById(
					supabaseUserId,
					{ password },
				);
				if (pwError) console.warn("Could not reset password:", pwError.message);
				else console.log("✓ Reset Supabase auth password");
			} else {
				throw createError;
			}
		} else {
			supabaseUserId = createData.user.id;
			console.log("✓ Created Supabase auth user");
		}

		// Upsert the database record using the Supabase Auth UID as the DB id
		const user = await prisma.user.upsert({
			where: { id: supabaseUserId },
			update: { role: "ADMIN", fullName, email },
			create: {
				id: supabaseUserId,
				email,
				fullName,
				role: "ADMIN",
			},
		});

		console.log("✓ Database record synced, id:", user.id);
		console.log("\n=== Admin Credentials ===");
		console.log("Email   :", email);
		console.log("Password:", password);
		console.log("URL     : http://localhost:3000/admin/login");
		console.log("========================\n");
	} catch (error) {
		console.error("Error:", error);
	} finally {
		await prisma.$disconnect();
	}
}

createAdminUser();
