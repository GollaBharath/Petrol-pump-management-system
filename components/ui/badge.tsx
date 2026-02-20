import * as React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
	variant?: "default" | "secondary" | "destructive" | "outline";
}

export function Badge({
	className = "",
	variant = "default",
	...props
}: BadgeProps) {
	const variants = {
		default: "bg-blue-600 text-white hover:bg-blue-700",
		secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300",
		destructive: "bg-red-600 text-white hover:bg-red-700",
		outline: "border border-gray-300 text-gray-900",
	};

	return (
		<div
			className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${variants[variant]} ${className}`}
			{...props}
		/>
	);
}
