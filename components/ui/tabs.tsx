"use client";

import * as React from "react";

interface TabsProps {
	defaultValue?: string;
	value?: string;
	onValueChange?: (value: string) => void;
	className?: string;
	children: React.ReactNode;
}

interface TabsListProps {
	className?: string;
	children: React.ReactNode;
}

interface TabsTriggerProps {
	value: string;
	className?: string;
	children: React.ReactNode;
}

interface TabsContentProps {
	value: string;
	className?: string;
	children: React.ReactNode;
}

const TabsContext = React.createContext<{
	value: string;
	onValueChange: (value: string) => void;
}>({
	value: "",
	onValueChange: () => {},
});

export function Tabs({
	defaultValue = "",
	value,
	onValueChange,
	className = "",
	children,
}: TabsProps) {
	const [internalValue, setInternalValue] = React.useState(defaultValue);
	const currentValue = value !== undefined ? value : internalValue;
	const handleValueChange = onValueChange || setInternalValue;

	return (
		<TabsContext.Provider
			value={{ value: currentValue, onValueChange: handleValueChange }}>
			<div className={className}>{children}</div>
		</TabsContext.Provider>
	);
}

export function TabsList({ className = "", children }: TabsListProps) {
	return (
		<div
			className={`inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 ${className}`}>
			{children}
		</div>
	);
}

export function TabsTrigger({
	value,
	className = "",
	children,
}: TabsTriggerProps) {
	const { value: currentValue, onValueChange } = React.useContext(TabsContext);
	const isActive = currentValue === value;

	return (
		<button
			type="button"
			onClick={() => onValueChange(value)}
			className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
				isActive
					? "bg-white text-gray-900 shadow-sm"
					: "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
			} ${className}`}>
			{children}
		</button>
	);
}

export function TabsContent({
	value,
	className = "",
	children,
}: TabsContentProps) {
	const { value: currentValue } = React.useContext(TabsContext);

	if (currentValue !== value) {
		return null;
	}

	return (
		<div
			className={`mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 ${className}`}>
			{children}
		</div>
	);
}
