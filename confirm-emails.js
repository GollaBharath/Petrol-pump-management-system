const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL,
	process.env.SUPABASE_SERVICE_ROLE_KEY,
);

async function confirmAllEmails() {
	console.log("Confirming emails for all users...\n");

	try {
		const { data: users } = await supabase.auth.admin.listUsers();

		for (const user of users.users) {
			if (!user.email_confirmed_at) {
				const { error } = await supabase.auth.admin.updateUserById(user.id, {
					email_confirm: true,
				});

				if (error) {
					console.error(`❌ Failed to confirm ${user.email}:`, error.message);
				} else {
					console.log(`✓ Confirmed ${user.email}`);
				}
			} else {
				console.log(`✓ ${user.email} already confirmed`);
			}
		}

		console.log("\nAll emails confirmed! You can now login.");
	} catch (error) {
		console.error("Error:", error);
	}
}

confirmAllEmails();
