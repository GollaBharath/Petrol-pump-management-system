import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
	title: "Petrol Pump Management System",
	description:
		"A digitized fuel delivery management system for petrol pumps in India",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body>{children}</body>
		</html>
	);
}
