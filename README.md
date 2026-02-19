# Petrol Pump Management System

A comprehensive digital fuel delivery management system for petrol pumps in India. This system allows customers to place fuel orders, employees to fulfill orders, and administrators to manage operations, pricing, and billing.

## Overview

The Petrol Pump Management System is a complete solution for modernizing fuel delivery operations. It combines a mobile app for customers and employees with a web-based admin dashboard, all powered by a robust backend API and real-time database.

## Features

### Customer Features

- Place fuel orders by amount or quantity
- Track order status in real-time
- View order history
- Mobile-first interface

### Employee Features

- View pending orders
- Mark orders as delivered
- Track personal performance
- Real-time order notifications

### Admin Features

- Manage daily fuel prices (24-hour enforcement)
- Track all orders and their status
- Manage billing and payments
- Monitor cash advances and reconciliation
- View comprehensive analytics and reports
- Track employee performance
- Real-time dashboard with live updates

### Technical Features

- **Real-time Order Tracking** - Live status updates using Supabase subscriptions
- **Comprehensive Billing System** - Price-aware calculations with tax, discounts, and multiple payment methods
- **Role-Based Access Control** - Three user roles (Customer, Employee, Admin) with granular permissions
- **Price Management** - 24-hour enforcement rule for daily fuel prices
- **Cash Advance System** - Track and reconcile driver cash advances
- **Analytics & Reporting** - Comprehensive reports on orders, revenue, and payments

## Technology Stack

| Component        | Technology             |
| ---------------- | ---------------------- |
| Mobile App       | Flutter                |
| Backend API      | Next.js 14+            |
| Database         | Supabase PostgreSQL    |
| ORM              | Prisma                 |
| Authentication   | Supabase Auth          |
| Real-time        | Supabase Subscriptions |
| State Management | Riverpod               |
| Validation       | Zod                    |
| Admin Dashboard  | React + Recharts       |

## Project Structure

```
├── app/                          # Next.js application
│   ├── api/                      # REST API endpoints
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── orders/               # Order management
│   │   ├── bills/                # Billing system
│   │   ├── prices/               # Fuel price management
│   │   └── cash-advances/        # Cash advance tracking
│   └── dashboard/                # Admin dashboard pages
├── lib/                          # Shared utilities
│   ├── auth.ts                   # Authentication utilities
│   ├── billing-utils.ts          # Billing calculations
│   ├── realtime-utils.ts         # Real-time subscriptions
│   ├── db-utils.ts               # Database utilities
│   ├── validation.ts             # Input validation schemas
│   └── prisma.ts                 # Prisma client singleton
├── flutter_app/                  # Flutter mobile application
│   ├── lib/
│   │   ├── screens/              # Application screens
│   │   ├── providers/            # Riverpod state management
│   │   ├── services/             # API services
│   │   └── main.dart             # App entry point
├── prisma/                       # Database schema and migrations
│   ├── schema.prisma             # Prisma data model
│   └── migrations/               # Database migrations
└── public/                       # Static assets
```

## Getting Started

### Prerequisites

- Node.js 20+
- Flutter 3.0+
- PostgreSQL (via Supabase)
- npm or yarn

### Backend Setup (Web Dashboard & API)

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   Create a `.env` file with your Supabase credentials:

   ```bash
   DATABASE_URL="postgresql://[user]:[password]@[host]:[port]/[database]?schema=public"
   NEXT_PUBLIC_SUPABASE_URL="https://[project].supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="[anon-key]"
   SUPABASE_SERVICE_ROLE_KEY="[service-role-key]"
   ```

3. **Initialize the database**

   ```bash
   # Generate Prisma Client
   npx prisma generate

   # Deploy migrations to create schema
   npx prisma migrate deploy

   # Optional: seed test data
   npx prisma db seed
   ```

4. **Start the development server**

   ```bash
   npm run dev
   ```

   - Web Dashboard: http://localhost:3000
   - API Base URL: http://localhost:3000/api

### Flutter Mobile App Setup

1. **Navigate to the Flutter app**

   ```bash
   cd flutter_app
   ```

2. **Install dependencies**

   ```bash
   flutter pub get
   ```

3. **Configure API endpoint** (in `lib/config/app_config.dart`)

   Update the `apiBaseUrl` to point to your backend:

   ```dart
   static const String apiBaseUrl = 'http://localhost:3000/api'; // Local development
   // or
   static const String apiBaseUrl = 'https://your-production-domain.com/api'; // Production
   ```

4. **Run on device or emulator**

   ```bash
   flutter run
   ```

## API Documentation

The system provides 30+ REST API endpoints organized by feature:

### Authentication

- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Orders

- `POST /api/orders` - Create new order
- `GET /api/orders` - List customer's orders
- `GET /api/orders/[id]` - Get order details
- `GET /api/orders/pending` - List pending orders (employee)
- `PATCH /api/orders/[id]` - Update order status
- `GET /api/orders/real-time` - Real-time order subscriptions

### Billing

- `POST /api/bills` - Create bill from delivered order
- `GET /api/bills` - List bills with filters
- `GET /api/bills/[id]` - Get bill details
- `PATCH /api/bills/[id]/pay` - Mark bill as paid
- `GET /api/bills/reports/analytics` - Get billing analytics

### Prices

- `POST /api/prices` - Set daily fuel price
- `PUT /api/prices` - Update price (within 24h)
- `GET /api/prices` - Get current price status
- `GET /api/prices/history/[fuelType]` - Get price history

### Cash Advances

- `POST /api/cash-advances` - Create cash advance
- `GET /api/cash-advances/[id]` - Get cash advance details
- `GET /api/cash-advances/report` - Get cash advance report
- `POST /api/cash-advances/reconcile/[id]` - Reconcile cash advance

See ARCHITECTURE.md for detailed API documentation.

## Database Schema

### Core Tables

**users**

- Stores customer, employee, and admin accounts
- Role-based access control
- Authentication credentials

**orders**

- Tracks fuel orders
- Supports amount-based and quantity-based orders
- Status tracking (Pending, Delivered, Billed, Paid)

**bills**

- Stores billing information
- Price captured at delivery time
- Tracks tax, discounts, and cash advances
- Payment method and status tracking

**fuel_prices**

- Daily fuel prices by type
- 24-hour enforcement rule
- Price history tracking

**cash_advance_transactions**

- Tracks cash given to drivers
- Reconciliation with bills
- Summary reports

**audit_logs**

- Admin action audit trail
- Compliance and security tracking

## Key Features Explained

### Real-time Order Tracking

Orders update automatically across all connected clients using Supabase real-time subscriptions. When an employee marks an order as delivered, customers and admins see the update instantly without page refresh.

### Billing System

The billing system captures prices at delivery time (not order creation time). It supports:

- Tax calculations
- Discount application
- Multiple payment methods (Cash, UPI, Cheque, Bank Transfer)
- Cash advance reconciliation
- Automatic status management (Pending → Paid → Overdue)

### Price Management

Admins can set fuel prices once every 24 hours. The system enforces this rule and provides status indicators showing which fuel types need price updates.

### Cash Advance Tracking

Track cash disbursed to drivers, reconcile with final bills, and generate reports for settlement.

## Admin Dashboard

The admin dashboard provides:

- **Overview** - Key metrics and trends
- **Orders** - Full order management with search and filtering
- **Bills** - Billing and payment tracking
- **Prices** - Price management and history
- **Cash Advances** - Cash advance tracking and reconciliation
- **Employees** - Employee activity monitoring

All sections feature real-time updates and comprehensive filtering options.

## Development

### Run Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
npm start
```

### Database Commands

```bash
# Create a new migration
npx prisma migrate dev --name migration_name

# Deploy migrations to production
npx prisma migrate deploy

# View database in Prisma Studio
npx prisma studio
```

### Testing

```bash
npm run test
npm run test:watch
```

## Deployment

### Backend (Vercel)

```bash
npm run build
vercel deploy --prod
```

### Database (Supabase)

1. Create Supabase project
2. Configure environment variables
3. Run migrations: `npx prisma migrate deploy`

### Flutter App

```bash
# Android
flutter build apk --release

# iOS
flutter build ios --release
```

## Security Considerations

- All API endpoints require authentication
- Role-based access control on all operations
- Input validation using Zod schemas
- Row-level security (RLS) on database tables
- Environment variables for sensitive data
- Audit logging for compliance

## Performance Optimization

- Database indexes on commonly queried fields
- Pagination support (default 50 items per page)
- Real-time subscriptions instead of polling
- Stateless API design for scalability
- Efficient query optimization

## Troubleshooting

### Database Connection Issues

- Verify `DATABASE_URL` in `.env.local`
- Check Supabase project is active
- Run `npx prisma db push` to validate connection

### Real-time Subscriptions Not Working

- Verify Supabase subscriptions are enabled
- Check browser console for connection errors
- Restart the development server

### API Endpoints Returning 403

- Verify user authentication token
- Check user role has required permissions
- Review API endpoint authorization rules

## Troubleshooting

### Database Migration Issues

If you encounter migration errors:

```bash
# Check migration status
npx prisma migrate status

# If a migration failed, mark it as resolved:
npx prisma migrate resolve --applied <migration-name>

# Then deploy remaining migrations:
npx prisma migrate deploy
```

### Common Issues

**Port 3000 already in use:**

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or run on a different port
PORT=3001 npm run dev
```

**Flutter app can't reach backend:**

- Ensure `apiBaseUrl` in `lib/config/app_config.dart` points to correct backend
- For local testing, use your machine's IP instead of `localhost`
- Check firewall settings allow port 3000

**Prisma Client not found:**

```bash
npx prisma generate
npm install
```

## Support & Documentation

For detailed information, refer to:

- **ARCHITECTURE.md** - System design and detailed API documentation
- API endpoint implementations in `app/api/` directory
- Flutter app in `flutter_app/` directory
- Database schema in `prisma/schema.prisma`

## Contributing

1. Follow the existing code style and organization
2. Add tests for new features
3. Update documentation for API changes
4. Test both mobile and web applications

## License

This project is developed for internal use in petrol pump management.

## Status

✅ **PRODUCTION READY** - All features implemented and tested

- 30+ API endpoints
- 6 database tables with relationships
- 15+ Flutter screens
- Real-time functionality
- Complete admin dashboard
- Comprehensive billing system
