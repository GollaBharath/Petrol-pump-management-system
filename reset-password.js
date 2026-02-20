const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL,
	process.env.SUPABASE_SERVICE_ROLE_KEY,
);

async function resetPassword() {
	const email = "gollabharath2007@gmail.com";
	const newPassword = "bharath123"; // Set a new password

	console.log("Resetting password for:", email);

	try {
		// Get the user ID
		const { data: users } = await supabase.auth.admin.listUsers();
		const user = users.users.find((u) => u.email === email);

		if (!user) {
			console.log("User not found!");
			return;
		}

		console.log("User ID:", user.id);

		// Update password using admin API
		const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
			password: newPassword,
		});

		if (error) {
			console.error("Error updating password:", error);
		} else {
			console.log("Password updated successfully!");
			console.log("New credentials:");
			console.log("  Email:", email);
			console.log("  Password:", newPassword);
			console.log("\nYou can now login with these credentials.");
		}
	} catch (error) {
		console.error("Unexpected error:", error);
	}
}

resetPassword();
