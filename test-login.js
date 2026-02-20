const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL,
	process.env.SUPABASE_SERVICE_ROLE_KEY,
);

async function testLogin() {
	const email = "gollabharath2007@gmail.com";
	const password = "bharath123"; // Updated password

	console.log("Testing login for:", email);
	console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);

	try {
		// Try to sign in
		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});

		if (error) {
			console.error("Login error:", error.message);
			console.error("Error details:", error);

			// Check if user exists in Supabase Auth
			console.log("\nChecking if user exists in Supabase Auth...");
			const { data: users, error: listError } =
				await supabase.auth.admin.listUsers();
			if (listError) {
				console.error("Cannot list users:", listError);
			} else {
				console.log("Total users in Supabase Auth:", users.users.length);
				const user = users.users.find((u) => u.email === email);
				if (user) {
					console.log("User found in Supabase Auth:", user.email);
				} else {
					console.log("User NOT found in Supabase Auth!");
					console.log(
						"This means the user exists in database but not in Supabase Auth.",
					);
					console.log(
						"You need to create the user account using the signup endpoint.",
					);
				}
			}
		} else {
			console.log("Login successful!");
			console.log("User:", data.user.email);
			console.log("Has session:", !!data.session);
		}
	} catch (error) {
		console.error("Unexpected error:", error);
	}
}

testLogin();
