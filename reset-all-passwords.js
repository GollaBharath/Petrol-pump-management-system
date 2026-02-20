const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL,
	process.env.SUPABASE_SERVICE_ROLE_KEY,
);

async function resetAllPasswords() {
	console.log("Resetting passwords for all users...\n");

	const credentials = [
		{
			email: "gollabharath2007@gmail.com",
			password: "bharath123",
			role: "CUSTOMER",
		},
		{ email: "qwe@gmail.com", password: "employee123", role: "EMPLOYEE" },
	];

	try {
		const { data: users } = await supabase.auth.admin.listUsers();

		for (const cred of credentials) {
			const user = users.users.find((u) => u.email === cred.email);

			if (user) {
				const { error } = await supabase.auth.admin.updateUserById(user.id, {
					password: cred.password,
				});

				if (error) {
					console.error(`❌ Failed to update ${cred.email}:`, error.message);
				} else {
					console.log(`✓ ${cred.email}`);
					console.log(`  Role: ${cred.role}`);
					console.log(`  Password: ${cred.password}\n`);
				}
			}
		}

		console.log("Password reset complete!");
		console.log(
			"\nYou can now login with these credentials in your Flutter app.",
		);
	} catch (error) {
		console.error("Error:", error);
	}
}

resetAllPasswords();
