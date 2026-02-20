# Test User Credentials

## Available Users

### Admin Account (Web Dashboard)

- **Email:** admin@petrolpump.com
- **Password:** admin123
- **Role:** ADMIN
- **Access:** Web dashboard at http://localhost:3000/admin/login

### Seeded Test Accounts (Database)

#### Admin (Seeded)

- **Email:** admin@petrompump.local
- **Password:** (Use Supabase to set password or use create-admin.js script)
- **Role:** ADMIN
- **Phone:** 9999999999

#### Employee (Seeded)

- **Email:** employee@petrompump.local
- **Password:** (Use Supabase to set password)
- **Role:** EMPLOYEE
- **Phone:** 9888888888

#### Customer 1 (Seeded)

- **Email:** customer1@petrompump.local
- **Full Name:** Rajesh Kumar
- **Password:** (Use Supabase to set password)
- **Role:** CUSTOMER
- **Phone:** 9876543210

#### Customer 2 (Seeded)

- **Email:** customer2@petrompump.local
- **Full Name:** Priya Singh
- **Password:** (Use Supabase to set password)
- **Role:** CUSTOMER
- **Phone:** 9765432109

### Manual Test Accounts (Supabase Auth + Database)

#### Customer Account

- **Email:** gollabharath2007@gmail.com
- **Password:** bharath123
- **Role:** CUSTOMER

#### Employee Account

- **Email:** qwe@gmail.com
- **Password:** employee123
- **Role:** EMPLOYEE

## Backend URL

- Local: http://192.168.0.7:3000/api
- Localhost: http://localhost:3000/api

## Database Seed Data

The `npm run prisma:seed` command creates:

- 1 Admin user (admin@petrompump.local)
- 1 Employee user (employee@petrompump.local)
- 2 Customer users (customer1@petrompump.local, customer2@petrompump.local)
- 2 Fuel prices (Petrol: ₹105.50/L, Diesel: ₹94.25/L)
- 2 Sample orders (1 PENDING, 1 DELIVERED)
- 1 Sample bill
- Audit logs

**Note:** Seeded users only exist in the database. You need to create corresponding Supabase Auth accounts or use the manual test accounts above for login.

## Notes

- Manual test accounts have confirmed emails in Supabase
- Passwords have been set for manual test accounts
- You can login with manual test credentials in the Flutter app
- To create a new account, use the signup endpoint/screen
- Seeded accounts from `prisma:seed` need Supabase Auth accounts to be created separately

## Creating New Users

New users created through the signup endpoint will:

- Automatically have their emails confirmed
- Be able to login immediately after signup
- Be stored in both Supabase Auth and the database
