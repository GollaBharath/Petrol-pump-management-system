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

	console.log("Creating admin user...");

	try {
		// Create user in Supabase Auth
		const { data: authData, error: authError } =
			await supabase.auth.admin.createUser({
				email,
				password,
				email_confirm: true,
			});

		if (authError) {
			console.error("Error creating auth user:", authError);
			return;
		}

		console.log("✓ Created Supabase auth user");

		// Create user in database
		const user = await prisma.user.upsert({
			where: { id: authData.user.id },
			update: {
				role: "ADMIN",
				fullName,
			},
			create: {
				id: authData.user.id,
				email,
				fullName,
				role: "ADMIN",
			},
		});

		console.log("✓ Created database user");
		console.log("\n=== Admin Credentials ===");
		console.log("Email:", email);
		console.log("Password:", password);
		console.log("URL: http://localhost:3000/admin/login");
		console.log("========================\n");
	} catch (error) {
		console.error("Error:", error);
	} finally {
		await prisma.$disconnect();
	}
}

createAdminUser();
