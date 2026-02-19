# Petrol Pump Management System - Architecture & Technical Specification

## System Overview

The Petrol Pump Management System is a digitized fuel delivery platform with three main components:

- **Mobile App (Flutter)** - For customers and employees
- **Backend API (Next.js)** - RESTful API with real-time capabilities
- **Admin Dashboard (Next.js + React)** - For system administration
- **Database (Supabase PostgreSQL)** - Single source of truth

## Architecture Principles

### 1. Role-Based Access Control (RBAC)

Three user roles with distinct permissions:

**CUSTOMER**

- Create and manage personal orders
- View order status in real-time
- View order history
- Cannot access admin features

**EMPLOYEE**

- View pending orders assigned to them
- Mark orders as delivered
- View personal performance metrics
- Cannot access admin features

**ADMIN**

- Access all orders system-wide
- Manage daily fuel prices
- Generate and manage bills
- Track cash advances
- View comprehensive analytics
- Access admin dashboard

### 2. Stateless API Design

- All API routes are stateless
- No server-side session storage
- JWT tokens for authentication
- Horizontal scalability support

### 3. Real-time First

- Supabase real-time subscriptions for live updates
- No polling required
- Automatic connection management
- Connection drop and reconnect handling

### 4. Single Source of Truth

- Database is the single source of truth
- No local caching of critical data
- Real-time subscriptions for updates
- Validation at database level

## Database Schema

### Tables

#### users

```sql
- id: UUID (PRIMARY KEY)
- email: VARCHAR (UNIQUE)
- password_hash: VARCHAR
- full_name: VARCHAR
- phone: VARCHAR
- role: ENUM (CUSTOMER, EMPLOYEE, ADMIN)
- is_active: BOOLEAN
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### orders

```sql
- id: UUID (PRIMARY KEY)
- customer_id: UUID (FK → users.id)
- vehicle_number: VARCHAR
- fuel_type: VARCHAR (Petrol, Diesel, etc.)
- amount_requested: DECIMAL (nullable - for amount-based orders)
- quantity_requested: DECIMAL (nullable - for quantity-based orders)
- quantity_delivered: DECIMAL (nullable - filled at delivery)
- cash_advance: DECIMAL (default 0)
- status: ENUM (PENDING, DELIVERED, BILLED, PAID)
- created_at: TIMESTAMP
- delivered_at: TIMESTAMP (nullable - set when delivered)
- updated_at: TIMESTAMP
```

#### bills

```sql
- id: UUID (PRIMARY KEY)
- order_id: UUID (FK → orders.id)
- customer_id: UUID (FK → users.id)
- quantity_delivered: DECIMAL
- price_per_liter: DECIMAL (captured at delivery time)
- total_amount: DECIMAL (quantity × price)
- tax_amount: DECIMAL
- discount_amount: DECIMAL
- cash_advance: DECIMAL
- net_amount: DECIMAL (total + tax - discount - cash_advance)
- payment_method: ENUM (CASH, UPI, CHEQUE, BANK_TRANSFER, null)
- status: ENUM (PENDING, PAID, OVERDUE)
- created_at: TIMESTAMP
- paid_at: TIMESTAMP (nullable - set when paid)
- updated_at: TIMESTAMP
```

#### fuel_prices

```sql
- id: UUID (PRIMARY KEY)
- fuel_type: VARCHAR
- price_per_liter: DECIMAL
- effective_date: DATE
- created_by_admin_id: UUID (FK → users.id)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- UNIQUE(fuel_type, effective_date)
```

#### cash_advance_transactions

```sql
- id: UUID (PRIMARY KEY)
- order_id: UUID (FK → orders.id)
- driver_id: UUID (FK → users.id)
- amount: DECIMAL
- transaction_type: ENUM (DISBURSED, RECONCILED)
- bill_id: UUID (FK → bills.id, nullable)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### audit_logs

```sql
- id: UUID (PRIMARY KEY)
- user_id: UUID (FK → users.id)
- action: VARCHAR
- table_name: VARCHAR
- changes: JSONB
- ip_address: VARCHAR (nullable)
- created_at: TIMESTAMP
```

## API Architecture

### Authentication Flow

1. User registers with email/password
2. System stores hashed password
3. User logs in and receives JWT token
4. Token includes user_id, role, and exp
5. Token validated on every API request
6. Supabase Auth manages token lifecycle

### API Endpoint Organization

#### Authentication (`/api/auth`)

- POST `/api/auth/signup` - Register new user
- POST `/api/auth/login` - Authenticate user
- POST `/api/auth/logout` - Invalidate session
- POST `/api/auth/refresh` - Refresh token

#### Orders (`/api/orders`)

- POST `/api/orders` - Create order (customer only)
- GET `/api/orders` - List customer's orders
- GET `/api/orders/[id]` - Get order details
- GET `/api/orders/all` - List all orders (admin only)
- GET `/api/orders/pending` - List pending orders (employee view)
- PATCH `/api/orders/[id]` - Update order status
- GET `/api/orders/real-time` - Real-time subscription

#### Billing (`/api/bills`)

- POST `/api/bills` - Create bill from order (admin only)
- GET `/api/bills` - List bills with filters
- GET `/api/bills/[id]` - Get bill details
- GET `/api/bills/[id]/pay` - Mark bill as paid (admin only)
- GET `/api/bills/reports/analytics` - Get billing analytics (admin only)

#### Prices (`/api/prices`)

- POST `/api/prices` - Set daily price (admin only)
- PUT `/api/prices` - Update price (admin only)
- GET `/api/prices` - Get price status
- GET `/api/prices/history/[fuelType]` - Get price history

#### Cash Advances (`/api/cash-advances`)

- POST `/api/cash-advances` - Create cash advance (admin only)
- GET `/api/cash-advances/[id]` - Get details
- GET `/api/cash-advances/report` - Get report (admin only)
- POST `/api/cash-advances/reconcile/[id]` - Reconcile (admin only)

### Request/Response Format

#### Standard Success Response

```json
{
	"success": true,
	"data": {
		/* resource data */
	},
	"message": "Operation successful"
}
```

#### Standard Error Response

```json
{
	"error": "Error type",
	"message": "Detailed error message",
	"details": []
}
```

#### Validation Error Response

```json
{
	"error": "Validation error",
	"details": [
		{
			"path": ["fieldName"],
			"code": "invalid_type",
			"message": "Expected string"
		}
	]
}
```

## Real-time System

### Supabase Real-time Subscriptions

The system uses Supabase's PostgreSQL real-time features:

```typescript
// Subscribe to all order changes
subscribeToOrders((order) => {
	// Handle order update
});

// Subscribe to specific order
subscribeToOrderUpdates(orderId, (order) => {
	// Handle order update
});

// Subscribe to price changes
subscribeToPriceChanges((price) => {
	// Handle price update
});

// Subscribe to bill updates
subscribeToBillUpdates((bill) => {
	// Handle bill update
});
```

### Connection Management

- Automatic reconnection on connection loss
- Exponential backoff for retry
- Graceful error handling
- Proper cleanup on unsubscribe

## Billing System

### Bill Creation Workflow

1. Order is marked as delivered by employee
2. Admin creates bill from delivered order
3. System fetches price effective on delivery date
4. Bill calculates: (Quantity × Price) + Tax - Discount - CashAdvance = Net Amount
5. Bill status set to PENDING

### Bill Status Transitions

```
PENDING → PAID (when payment recorded)
PENDING → OVERDUE (after due date)
PAID → Settlement complete
```

### Price Capture Rules

- Price is captured at order delivery time, NOT order creation time
- If no price for delivery date, use most recent available price
- Price is immutable once captured in bill
- Historical prices maintained for audit trail

### Payment Methods

- **CASH** - Direct cash payment
- **UPI** - Digital payment (UPI)
- **CHEQUE** - Check payment
- **BANK_TRANSFER** - Bank transfer

## Price Management System

### 24-Hour Enforcement Rule

- One price per fuel type per 24-hour period
- Admin can set price once per day
- Can update within same 24-hour window
- System enforces this rule in database

### Price Update Status

Admin dashboard shows:

- Current price for each fuel type
- Last update timestamp
- Hours since last update
- Visual indicator if price is overdue

### Price History

- Complete historical record of prices
- Useful for billing verification
- Accessible to all authenticated users
- Queryable by date range and fuel type

## Flutter App Architecture

### State Management (Riverpod)

```dart
// Provider for orders
final ordersProvider = StateNotifierProvider<OrdersNotifier, List<Order>>(
  (ref) => OrdersNotifier(ref.read(apiServiceProvider))
);

// Provider for real-time order tracking
final orderTrackingProvider = StreamProvider.autoDispose<Order>(
  (ref) => ref.read(apiServiceProvider).subscribeToOrder(orderId)
);
```

### Screens Hierarchy

```
MainApp
├── AuthScreen (login/signup)
├── CustomerHome
│   ├── OrderPlacementScreen
│   ├── OrderStatusScreen
│   └── OrderHistoryScreen
├── EmployeeHome
│   ├── PendingOrdersScreen
│   ├── OrderFulfillmentScreen
│   └── PerformanceScreen
└── AdminHome
    ├── DashboardScreen
    ├── OrderManagementScreen
    ├── BillingScreen
    └── PriceManagementScreen
```

### Local Caching Strategy

- Orders cached locally with sync on reconnect
- Prices cached with 24-hour TTL
- User profile cached
- Real-time subscriptions for live updates

## Admin Dashboard Components

### Overview Tab

- Key metrics (orders, revenue, pending bills)
- Trend charts
- Recent activity

### Orders Tab

- Filterable order list
- Status indicators
- Search functionality
- Order details modal

### Billing Tab

- Bill list with status
- Payment tracking
- Bill details
- Mark as paid functionality

### Prices Tab

- Current prices by fuel type
- Price status dashboard
- Set daily price form
- Price history view

### Cash Advances Tab

- Cash advance tracking
- Reconciliation interface
- Settlement reports

### Employees Tab

- Employee list with metrics
- Performance indicators
- Activity tracking

## Security Model

### Authentication

- Supabase Auth handles authentication
- JWT tokens stored securely
- Token expiration and refresh
- Password hashing (Supabase manages)

### Authorization

- Role-based access control (RBAC)
- Resource ownership verification
- API-level authorization checks
- Database-level RLS policies

### Input Validation

- All inputs validated with Zod schemas
- Type checking at API layer
- Database constraints as backup
- SQL injection prevention

### Audit Logging

- All admin actions logged
- Price changes tracked
- Bill creation/payment logged
- User actions audited

### Data Protection

- Sensitive data encrypted at rest
- HTTPS for all communication
- CORS properly configured
- Rate limiting on public endpoints

## Performance Optimization

### Database Indexing

```sql
-- Indexes created for commonly queried fields
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_bills_status ON bills(status);
CREATE INDEX idx_fuel_prices_date ON fuel_prices(effective_date);
CREATE INDEX idx_users_email ON users(email);
```

### Pagination

- Default page size: 50 items
- Limit: 100 items per request
- Offset-based pagination
- Efficient for large datasets

### Caching Strategy

- Real-time subscriptions instead of polling
- Local caching in Flutter app
- Database query optimization
- N+1 query prevention

### API Optimization

- Stateless design for scalability
- Request deduplication
- Compression of responses
- Efficient serialization

## Deployment Architecture

### Backend Deployment

- Deployed on Vercel or self-hosted
- Environment configuration via .env
- Database migrations managed by Prisma
- Auto-scaling support

### Database Deployment

- Supabase PostgreSQL
- Automated backups
- Read replicas for scaling
- Point-in-time recovery

### Mobile Deployment

- Flutter app on Google Play Store
- iOS app on App Store
- Internal beta testing with TestFlight/Firebase
- Version management

### Infrastructure

- CDN for static assets
- Load balancing for API
- Database connection pooling
- Monitoring and logging

## Error Handling

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (auth failed)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Server Error

### Error Logging

- Structured logging with timestamps
- Error tracking service (Sentry)
- User-friendly error messages
- Developer-detailed error logs

## Testing Strategy

### Unit Tests

- Utility function tests
- Calculation logic tests
- Validation schema tests

### Integration Tests

- API endpoint tests
- Database operation tests
- Authentication flow tests

### E2E Tests

- Complete workflow tests
- Mobile app testing
- Admin dashboard testing
- Real-time functionality testing

## Monitoring & Observability

### Metrics to Track

- API response times
- Database query performance
- Error rates and types
- User activity patterns
- Order processing time
- Payment success rates

### Logging

- API request/response logging
- Database query logging
- Error and exception logging
- User action audit logs

### Alerting

- High error rate alerts
- Database connection issues
- API performance degradation
- Unauthorized access attempts

## Future Enhancements

### Short-term

- SMS/Email notifications
- WhatsApp integration for orders
- Advanced analytics dashboard
- Recurring orders for regular customers

### Medium-term

- Payment gateway integration (Razorpay, PayU)
- Mobile payment apps
- Inventory management
- Driver app with real-time tracking

### Long-term

- Machine learning for demand prediction
- Fuel price optimization
- Multi-location support
- Supply chain management

## Conclusion

The Petrol Pump Management System is architected for scalability, real-time responsiveness, and secure multi-role operation. The system maintains a single source of truth in the database while leveraging real-time subscriptions for immediate updates across all clients. Role-based access control ensures proper authorization at every level, and comprehensive audit logging provides compliance and security.
