# Test User Credentials

## Working Login Accounts

### Admin (Web Dashboard + App)

- **Email:** admin@petrolpump.com
- **Password:** admin123
- **Role:** ADMIN
- **Access:** http://localhost:3000/admin/login

### Employee

- **Email:** employee@petrolpump.com
- **Password:** employee123
- **Role:** EMPLOYEE

### Customers

- **Email:** customer1@petrolpump.com / **Password:** customer123 (Rajesh Kumar)
- **Email:** customer2@petrolpump.com / **Password:** customer123 (Priya Singh)

### Extra Manual Test Accounts (Supabase Auth)

- **Email:** gollabharath2007@gmail.com / **Password:** bharath123 — CUSTOMER
- **Email:** qwe@gmail.com / **Password:** employee123 — EMPLOYEE

## Backend URL

- Local: http://192.168.0.7:3000/api
- Localhost: http://localhost:3000/api

## Database Seed Data

After `npx prisma migrate reset`, the seed (`prisma/seed.ts`) creates users in **both Supabase Auth and the database** so all accounts are immediately loginable:

- admin@petrolpump.com / admin123 (ADMIN)
- employee@petrolpump.com / employee123 (EMPLOYEE)
- customer1@petrolpump.com / customer123 (CUSTOMER — Rajesh Kumar)
- customer2@petrolpump.com / customer123 (CUSTOMER — Priya Singh)
- Petrol: ₹105.50/L, Diesel: ₹94.25/L (today's prices)
- 2 sample orders, 1 bill

## Price Management

- Fuel prices are **admin-only** — only admins can view or set prices
- Prices are set daily each morning by an admin
- Prices are used internally to calculate bills; they are not exposed to customers or employees
- Endpoints: `GET/POST /api/admin/prices` (admin token required)

## Notes

- Manual test accounts have confirmed emails in Supabase
- To create a new account, use the signup endpoint/screen or the Users tab in the admin dashboard
- New users created through the admin dashboard are immediately active in both Supabase Auth and the database
