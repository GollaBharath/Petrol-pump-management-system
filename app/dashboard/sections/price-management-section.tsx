"use client";

import { useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";

interface PriceStatus {
	fuelType: "PETROL" | "DIESEL";
	currentPrice: number | null;
	lastUpdated: string | null;
	needsUpdate: boolean;
	hoursOverdue: number;
}

const mockPriceStatus: PriceStatus[] = [
	{
		fuelType: "PETROL",
		currentPrice: 102.5,
		lastUpdated: "2026-02-19 06:00",
		needsUpdate: false,
		hoursOverdue: 0,
	},
	{
		fuelType: "DIESEL",
		currentPrice: null,
		lastUpdated: null,
		needsUpdate: true,
		hoursOverdue: 18,
	},
];

export default function PriceManagementSection() {
	const [selectedFuel, setSelectedFuel] = useState<"PETROL" | "DIESEL">(
		"PETROL",
	);
	const [newPrice, setNewPrice] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSetPrice = async () => {
		if (!newPrice || isNaN(parseFloat(newPrice))) {
			alert("Please enter a valid price");
			return;
		}

		setIsSubmitting(true);
		try {
			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 1000));
			alert(
				`Price for ${selectedFuel} set to ₹${parseFloat(newPrice).toFixed(2)}/L`,
			);
			setNewPrice("");
		} finally {
			setIsSubmitting(false);
		}
	};

	const petrolStatus = mockPriceStatus.find((p) => p.fuelType === "PETROL");
	const dieselStatus = mockPriceStatus.find((p) => p.fuelType === "DIESEL");

	return (
		<div className="space-y-6">
			{/* Price Status Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{[petrolStatus, dieselStatus].map((status) => (
					<Card key={status?.fuelType}>
						<CardHeader>
							<div className="flex justify-between items-start">
								<div>
									<CardTitle>{status?.fuelType}</CardTitle>
									<CardDescription>Current fuel price</CardDescription>
								</div>
								{status?.needsUpdate ? (
									<AlertCircle className="h-6 w-6 text-red-600" />
								) : (
									<CheckCircle className="h-6 w-6 text-green-600" />
								)}
							</div>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
								<p className="text-sm text-gray-600 mb-1">Price Per Liter</p>
								<p className="text-3xl font-bold">
									{status?.currentPrice
										? `₹${status.currentPrice.toFixed(2)}`
										: "Not set"}
								</p>
							</div>

							<div className="space-y-2">
								<div className="flex justify-between text-sm">
									<span className="text-gray-600">Last Updated:</span>
									<span className="font-medium">
										{status?.lastUpdated || "Never"}
									</span>
								</div>

								{status?.needsUpdate && (
									<div className="flex justify-between text-sm bg-red-50 p-2 rounded">
										<span className="text-red-900 font-medium">
											<Clock className="inline h-4 w-4 mr-1" />
											Overdue by {status.hoursOverdue} hours
										</span>
									</div>
								)}

								<Badge
									className={
										status?.needsUpdate
											? "bg-red-100 text-red-800"
											: "bg-green-100 text-green-800"
									}>
									{status?.needsUpdate ? "Update Required" : "Current"}
								</Badge>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Set Price Form */}
			<Card>
				<CardHeader>
					<CardTitle>Set Daily Price</CardTitle>
					<CardDescription>
						Update fuel prices for today. Can only set one price per fuel type
						per 24 hours.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg flex gap-3">
						<AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
						<p className="text-sm text-yellow-800">
							Only one price can be set per fuel type per 24 hours. Once set,
							prices can only be updated within the same day.
						</p>
					</div>

					<div className="space-y-4">
						<div>
							<Label htmlFor="fuel-type">Select Fuel Type</Label>
							<Select
								value={selectedFuel}
								onValueChange={(v) =>
									setSelectedFuel(v as "PETROL" | "DIESEL")
								}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="PETROL">Petrol</SelectItem>
									<SelectItem value="DIESEL">Diesel</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div>
							<Label htmlFor="price">Price Per Liter (₹)</Label>
							<Input
								id="price"
								type="number"
								step="0.01"
								min="0"
								placeholder="Enter price"
								value={newPrice}
								onChange={(e) => setNewPrice(e.target.value)}
							/>
						</div>

						<Button
							onClick={handleSetPrice}
							disabled={isSubmitting || !newPrice}
							className="w-full"
							size="lg">
							{isSubmitting ? "Setting Price..." : "Set Price"}
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Price History */}
			<Card>
				<CardHeader>
					<CardTitle>Recent Price Changes</CardTitle>
					<CardDescription>Last 10 price updates</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-2">
						{[
							{
								date: "2026-02-19 06:00",
								fuel: "PETROL",
								price: 102.5,
								setPy: "Admin",
							},
							{
								date: "2026-02-18 06:00",
								fuel: "PETROL",
								price: 102.25,
								setPy: "Admin",
							},
							{
								date: "2026-02-17 06:00",
								fuel: "PETROL",
								price: 102.0,
								setPy: "Admin",
							},
							{
								date: "2026-02-16 06:00",
								fuel: "PETROL",
								price: 101.75,
								setPy: "Admin",
							},
							{
								date: "2026-02-15 06:00",
								fuel: "PETROL",
								price: 101.5,
								setPy: "Admin",
							},
						].map((entry, idx) => (
							<div
								key={idx}
								className="flex justify-between items-center p-3 border rounded-lg">
								<div>
									<p className="font-medium">{entry.fuel}</p>
									<p className="text-sm text-gray-600">{entry.date}</p>
								</div>
								<div className="text-right">
									<p className="font-bold text-lg">
										₹{entry.price.toFixed(2)}/L
									</p>
									<p className="text-xs text-gray-600">{entry.setPy}</p>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
