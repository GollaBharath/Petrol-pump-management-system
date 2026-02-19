export default function Home() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center p-24">
			<div className="text-center">
				<h1 className="text-4xl font-bold mb-4">
					Petrol Pump Management System
				</h1>
				<p className="text-xl text-gray-600 mb-8">
					Digitized fuel delivery management system for petrol pumps in India
				</p>
				<div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
					<h2 className="text-2xl font-semibold mb-4">API Endpoints</h2>
					<div className="text-left">
						<h3 className="text-lg font-semibold mb-2">Authentication</h3>
						<ul className="list-disc list-inside mb-4 space-y-1">
							<li>POST /api/auth/signup - Register user</li>
							<li>POST /api/auth/login - Login user</li>
						</ul>

						<h3 className="text-lg font-semibold mb-2">Orders</h3>
						<ul className="list-disc list-inside mb-4 space-y-1">
							<li>POST /api/orders - Create new order</li>
							<li>GET /api/orders - List customer&apos;s orders</li>
							<li>GET /api/orders/pending - List pending orders (employee)</li>
							<li>GET /api/orders/[id] - Get order details</li>
							<li>PATCH /api/orders/[id] - Mark order as delivered</li>
						</ul>

						<h3 className="text-lg font-semibold mb-2">Prices</h3>
						<ul className="list-disc list-inside mb-4 space-y-1">
							<li>POST /api/prices - Set fuel price (admin)</li>
							<li>GET /api/prices - Get latest prices</li>
							<li>GET /api/prices/history - Get price history</li>
						</ul>

						<h3 className="text-lg font-semibold mb-2">Bills</h3>
						<ul className="list-disc list-inside space-y-1">
							<li>POST /api/bills - Generate bill (admin)</li>
							<li>GET /api/bills - List all bills (admin)</li>
							<li>GET /api/bills/[id] - Get bill details</li>
							<li>PATCH /api/bills/[id] - Mark bill as paid (admin)</li>
						</ul>
					</div>
				</div>
			</div>
		</main>
	);
}
