# Petrol Pump Management - Flutter App

A comprehensive Flutter mobile application for managing petrol pump operations with role-based access control for customers and employees.

## Project Structure

```
lib/
├── main.dart                          # App entry point with Riverpod ProviderScope
├── config/
│   └── app_config.dart               # Configuration constants (colors, API URLs, etc.)
├── models/
│   └── models.dart                   # Data classes (Order, FuelPrice, Bill, User)
├── services/
│   └── api_service.dart              # Dio HTTP client with auth interceptor
├── providers/
│   ├── providers.dart                # Riverpod providers for domain operations
│   └── auth_provider.dart            # Auth state management
├── routes/
│   └── app_routes.dart               # Named route definitions
└── screens/
    ├── auth/
    │   ├── login_screen.dart         # Login with email/password validation
    │   └── signup_screen.dart        # Signup with role selection
    ├── customer/
    │   ├── home_screen.dart          # Customer dashboard with menu cards
    │   ├── order_placement_screen.dart # Order creation form
    │   ├── my_orders_screen.dart     # Customer's order list & details
    │   └── order_details_screen.dart # Order detail view
    ├── employee/
    │   ├── home_screen.dart          # Employee dashboard
    │   ├── pending_orders_screen.dart # List of pending orders
    │   └── order_fulfillment_screen.dart # Mark orders as delivered
    └── shared/
        ├── prices_screen.dart        # Current & historical fuel prices
        └── bills_screen.dart         # Billing information
```

## Features

### Authentication

- **Login**: Email/password authentication with JWT tokens
- **Signup**: Role selection (CUSTOMER/EMPLOYEE) during registration
- **Token Management**: Automatic token injection via Dio interceptor

### Customer Features

- **Home Dashboard**: Menu-driven interface with options for order placement, viewing orders, and fuel prices
- **Order Placement**:
  - Toggle between quantity (liters) and amount-based ordering
  - Fuel type selection (PETROL, DIESEL)
  - Cash advance field for post-payment orders
  - Real-time validation
- **My Orders**: View all customer orders with detailed status and information
- **Fuel Prices**: View current prices and historical price changes

### Employee Features

- **Home Dashboard**: Quick access to pending orders, fuel prices, and billing
- **Pending Orders**: List view of all pending orders ready for fulfillment
- **Order Fulfillment**:
  - Record quantity delivered
  - Automatic charge calculation
  - Mark orders as completed
- **Fuel Prices**: Access to current and historical pricing information
- **Billing**: View pending and paid bills with due dates

### Shared Features

- **Fuel Prices**: Current prices and price history (accessible to both roles)
- **Bills**: View billing information (status, amounts, due dates)

## State Management (Riverpod)

### Key Providers

#### Authentication

```dart
authProvider              // Current auth state
authStateProvider        // Watch auth state changes
currentUserProvider      // Get logged-in user data
```

#### Orders

```dart
createOrderProvider       // Create new orders
ordersProvider           // List all customer orders
pendingOrdersProvider    // List pending orders (employee)
orderDetailsProvider     // Get single order details
markOrderDeliveredProvider // Update order status
```

#### Prices

```dart
latestPricesProvider     // Get current fuel prices
priceHistoryProvider     // Get price change history
```

#### Bills

```dart
billsProvider            // Get all bills
```

## API Integration

All API calls go through `ApiService` which handles:

- Base URL configuration
- Request/response interceptors
- Automatic token injection
- Error handling
- Timeout management

### Endpoints Used

- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/orders` - Create order
- `GET /api/orders` - List customer orders
- `GET /api/orders/pending` - List pending orders (employee)
- `PUT /api/orders/:id/delivered` - Mark order as delivered
- `GET /api/prices` - Get current prices
- `GET /api/prices/history` - Get price history
- `GET /api/bills` - Get bills
- `POST /api/bills/:id/mark-paid` - Mark bill as paid

## Dependencies

### Core

- `flutter` - UI framework
- `flutter_riverpod` - State management
- `riverpod_annotation` - Riverpod annotations

### HTTP & Networking

- `dio` - HTTP client with interceptor support
- `pretty_dio_logger` - HTTP request/response logging

### Authentication

- `supabase_flutter` - Supabase integration (optional)

### Data & Storage

- `json_serializable` - JSON serialization
- `shared_preferences` - Local data storage
- `hive` - Local database (optional)

### UI & UX

- `google_fonts` - Custom fonts
- `intl` - Internationalization & date formatting
- `flutter_local_notifications` - Local notifications
- `qr_flutter` - QR code generation
- `connectivity_plus` - Network connectivity checking
- `uuid` - UUID generation

## Configuration

Edit `lib/config/app_config.dart` to customize:

```dart
static const String apiBaseUrl = 'http://localhost:3000';
static const Duration requestTimeout = Duration(seconds: 30);
static const String appName = 'Petrol Pump Management';
static const Color primaryColor = Color(0xFF3B82F6);
static const Color accentColor = Color(0xFFEF4444);
```

## Getting Started

### Prerequisites

- Flutter 3.0+
- Dart 3.0+
- Android Studio / Xcode (for iOS development)

### Installation

1. **Get dependencies**

   ```bash
   flutter pub get
   ```

2. **Generate code**

   ```bash
   flutter pub run build_runner build
   ```

3. **Run the app**
   ```bash
   flutter run
   ```

### Development

**Hot Reload**

```bash
flutter run
# Then press 'r' to hot reload
```

**Hot Restart**

```bash
# Press 'R' during flutter run to hot restart
```

## Navigation Flow

### Customer

```
Login/Signup → Home Dashboard
           ├── Order Placement → Create Order
           ├── My Orders → Order Details
           └── Prices → Price History
```

### Employee

```
Login/Signup → Home Dashboard
           ├── Pending Orders → Order Fulfillment
           ├── Prices → Price History
           └── Billing → Bill Details
```

## Error Handling

All screens include:

- Loading states (CircularProgressIndicator)
- Error handling with user-friendly messages
- Form validation before API calls
- Network error recovery with refresh indicators

## Best Practices Used

1. **Riverpod Family Pattern**: Parameterized async operations

   ```dart
   ref.watch(markOrderDeliveredProvider(orderId: id, quantity: 10))
   ```

2. **ConsumerWidget/ConsumerStatefulWidget**: Direct provider access

   ```dart
   class MyScreen extends ConsumerWidget {
     @override
     Widget build(BuildContext context, WidgetRef ref) {
       final data = ref.watch(someProvider);
     }
   }
   ```

3. **Form Validation**: Before submitting to API

   ```dart
   if (email.isEmpty || !email.contains('@')) {
     showError('Invalid email');
     return;
   }
   ```

4. **Loading States**: Disable buttons during API calls
   ```dart
   ElevatedButton(
     onPressed: isLoading ? null : _handleSubmit,
     child: isLoading ? CircularProgressIndicator() : Text('Submit'),
   )
   ```

## Testing

### Unit Tests

```bash
flutter test
```

### Integration Tests

```bash
flutter drive --target=test_driver/app.dart
```

## Build & Deployment

### Debug Build

```bash
flutter build apk --debug
```

### Release Build

```bash
flutter build apk --release
flutter build ios --release
```

## Troubleshooting

### API Connection Issues

- Check `app_config.dart` API URL
- Ensure backend is running
- Check network connectivity
- Look at logs via `flutter logs`

### State Management Issues

- Use `ref.refresh()` to invalidate providers
- Check Riverpod DevTools browser extension
- Verify provider dependencies

### UI Issues

- Use `flutter run -v` for verbose output
- Check device logs: `flutter logs`
- Clear Flutter cache: `flutter clean`

## Future Enhancements

- [ ] Real-time order updates via WebSocket
- [ ] Offline support with local caching
- [ ] Admin dashboard for system management
- [ ] Advanced analytics and reporting
- [ ] Push notifications for order updates
- [ ] Payment gateway integration
- [ ] QR code-based order tracking

## Contributing

1. Follow Flutter best practices
2. Use meaningful commit messages
3. Test before submitting changes
4. Update documentation as needed

## License

This project is licensed under the MIT License - see LICENSE file for details.

## Support

For issues and questions, please contact the development team or create an issue in the project repository.
