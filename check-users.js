const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkUsers() {
	try {
		const users = await prisma.user.findMany({
			select: {
				email: true,
				fullName: true,
				role: true,
			},
		});

		console.log("Users in database:", users.length);
		users.forEach((user) => {
			console.log(`- ${user.email} (${user.fullName}) - ${user.role}`);
		});

		if (users.length === 0) {
			console.log(
				"\nNo users found in database. You need to create an account first.",
			);
			console.log("Try using the signup endpoint to create a user.");
		}
	} catch (error) {
		console.error("Error:", error.message);
	} finally {
		await prisma.$disconnect();
	}
}

checkUsers();
