import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:petrol_pump_management/models/models.dart';
import 'package:petrol_pump_management/services/api_service.dart';
import 'package:petrol_pump_management/providers/auth_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

// API Service Provider
final apiServiceProvider = Provider((ref) => ApiService());

// Auth Provider Alias (for compatibility with screens)
final authProvider = authNotifierProvider;

// Auth State Providers
final authStateProvider = StreamProvider((ref) async* {
  // Check if user is logged in
  final prefs = await SharedPreferences.getInstance();
  final token = prefs.getString('access_token');

  if (token != null) {
    yield null; // User logged in (will fetch user details)
  } else {
    yield null; // User not logged in
  }
});

final currentUserProvider = FutureProvider<User?>((ref) async {
  final prefs = await SharedPreferences.getInstance();
  final userJson = prefs.getString('user_data');

  if (userJson != null) {
    // Parse user from stored JSON (in real app, would fetch from API)
    return User.fromJson(Map<String, dynamic>.from(Map.from(userJson as Map)));
  }
  return null;
});

// Login Provider
final loginProvider =
    FutureProvider.family<void, ({String email, String password})>((
  ref,
  params,
) async {
  final apiService = ref.watch(apiServiceProvider);
  final result = await apiService.login(
    email: params.email,
    password: params.password,
  );

  final prefs = await SharedPreferences.getInstance();

  // Store session tokens
  if (result.containsKey('session')) {
    final session = result['session'] as Map<String, dynamic>;
    await prefs.setString('access_token', session['accessToken'] as String);
    if (session.containsKey('refreshToken')) {
      await prefs.setString('refresh_token', session['refreshToken'] as String);
    }
  }

  // Store user data
  if (result.containsKey('user')) {
    final user = result['user'] as Map<String, dynamic>;
    await prefs.setString('user_id', user['id'] as String);
    await prefs.setString('user_email', user['email'] as String);
    await prefs.setString('user_role', user['role'] as String);
    await prefs.setString('user_full_name', user['fullName'] as String);
    if (user.containsKey('phone') && user['phone'] != null) {
      await prefs.setString('user_phone', user['phone'] as String);
    }

    // Update auth notifier with user data
    final authNotifier = ref.read(authNotifierProvider.notifier);
    await authNotifier.setUser(User.fromJson(user));
  }

  // Invalidate current user provider to refetch
  ref.invalidate(currentUserProvider);
});

// Signup Provider
final signupProvider = FutureProvider.family<
    void,
    ({
      String email,
      String password,
      String fullName,
      String phone,
      String role,
    })>((ref, params) async {
  final apiService = ref.watch(apiServiceProvider);
  await apiService.signup(
    email: params.email,
    password: params.password,
    fullName: params.fullName,
    phone: params.phone,
    role: params.role,
  );
});

// Logout Provider
final logoutProvider = FutureProvider<void>((ref) async {
  final apiService = ref.watch(apiServiceProvider);
  await apiService.logout();

  final prefs = await SharedPreferences.getInstance();
  await prefs.remove('access_token');
  await prefs.remove('user_data');

  ref.invalidate(currentUserProvider);
});

// Orders Providers
final ordersProvider = FutureProvider<List<Order>>((ref) async {
  final apiService = ref.watch(apiServiceProvider);
  return apiService.getOrders();
});

final pendingOrdersProvider = FutureProvider<List<Order>>((ref) async {
  final apiService = ref.watch(apiServiceProvider);
  return apiService.getPendingOrders();
});

final orderDetailsProvider = FutureProvider.family<Order, String>((
  ref,
  orderId,
) async {
  final apiService = ref.watch(apiServiceProvider);
  return apiService.getOrderDetails(orderId);
});

final createOrderProvider = FutureProvider.family<
    Order,
    ({
      String vehicleNumber,
      String fuelType,
      double? amountRequested,
      double? quantityRequested,
      double cashAdvance,
    })>((ref, params) async {
  final apiService = ref.watch(apiServiceProvider);
  final order = await apiService.createOrder(
    vehicleNumber: params.vehicleNumber,
    fuelType: params.fuelType,
    amountRequested: params.amountRequested,
    quantityRequested: params.quantityRequested,
    cashAdvance: params.cashAdvance,
  );

  // Invalidate orders list to refetch
  ref.invalidate(ordersProvider);
  return order;
});

final markOrderDeliveredProvider =
    FutureProvider.family<Order, ({String orderId, double quantityDelivered})>((
  ref,
  params,
) async {
  final apiService = ref.watch(apiServiceProvider);
  final order = await apiService.markOrderDelivered(
    params.orderId,
    params.quantityDelivered,
  );

  // Invalidate providers to refetch
  ref.invalidate(pendingOrdersProvider);
  ref.invalidate(ordersProvider);
  ref.invalidate(orderDetailsProvider(params.orderId));

  return order;
});

// Price Providers
final pricesProvider = FutureProvider<List<FuelPrice>>((ref) async {
  final apiService = ref.watch(apiServiceProvider);
  return apiService.getLatestPrices();
});

// Alias for pricesProvider
final latestPricesProvider = pricesProvider;

final priceHistoryProvider = FutureProvider.family<List<FuelPrice>, String?>((
  ref,
  fuelType,
) async {
  final apiService = ref.watch(apiServiceProvider);
  return apiService.getPriceHistory(fuelType: fuelType);
});

// Bills Providers
final billsProvider = FutureProvider<List<Bill>>((ref) async {
  final apiService = ref.watch(apiServiceProvider);
  return apiService.getBills();
});

final billDetailsProvider = FutureProvider.family<Bill, String>((
  ref,
  billId,
) async {
  final apiService = ref.watch(apiServiceProvider);
  return apiService.getBillDetails(billId);
});
// Cash Advance Providers
final disburseCashAdvanceProvider = FutureProvider.family<Map<String, dynamic>,
    ({String orderId, String employeeId, double amount, String? description})>(
  (ref, params) async {
    final apiService = ref.watch(apiServiceProvider);
    final response = await apiService.disburseCashAdvance(
      orderId: params.orderId,
      employeeId: params.employeeId,
      amount: params.amount,
      description: params.description,
    );
    // Invalidate pending orders to refresh
    ref.invalidate(pendingOrdersProvider);
    return response;
  },
);

final employeeCashAdvanceSummaryProvider =
    FutureProvider.family<Map<String, dynamic>, String>(
        (ref, employeeId) async {
  final apiService = ref.watch(apiServiceProvider);
  return apiService.getEmployeeCashAdvanceSummary(employeeId);
});

final pendingCashAdvancesProvider =
    FutureProvider<Map<String, dynamic>>((ref) async {
  final apiService = ref.watch(apiServiceProvider);
  return apiService.getPendingCashAdvances();
});

final cashAdvanceReportProvider = FutureProvider.family<Map<String, dynamic>,
    ({DateTime startDate, DateTime endDate})>(
  (ref, params) async {
    final apiService = ref.watch(apiServiceProvider);
    return apiService.getCashAdvanceReport(
      startDate: params.startDate,
      endDate: params.endDate,
    );
  },
);

final reconcileCashAdvanceProvider = FutureProvider.family<Map<String, dynamic>,
    ({String transactionId, String billId, double amount})>(
  (ref, params) async {
    final apiService = ref.watch(apiServiceProvider);
    final response = await apiService.reconcileCashAdvance(
      transactionId: params.transactionId,
      billId: params.billId,
      amount: params.amount,
    );
    // Invalidate providers to refresh
    ref.invalidate(pendingCashAdvancesProvider);
    ref.invalidate(billsProvider);
    return response;
  },
);
// Price Management Providers (Admin)
final priceUpdateStatusProvider =
    FutureProvider<Map<String, dynamic>>((ref) async {
  final apiService = ref.watch(apiServiceProvider);
  return apiService.getPriceUpdateStatus();
});

final setDailyPriceProvider = FutureProvider.family<Map<String, dynamic>,
    ({String fuelType, double pricePerLiter, String? date})>(
  (ref, params) async {
    final apiService = ref.watch(apiServiceProvider);
    final response = await apiService.setDailyPrice(
      fuelType: params.fuelType,
      pricePerLiter: params.pricePerLiter,
      date: params.date,
    );
    // Invalidate related providers
    ref.invalidate(priceUpdateStatusProvider);
    ref.invalidate(latestPricesProvider);
    return response;
  },
);

final updateDailyPriceProvider = FutureProvider.family<Map<String, dynamic>,
    ({String priceId, double newPricePerLiter})>(
  (ref, params) async {
    final apiService = ref.watch(apiServiceProvider);
    final response = await apiService.updateDailyPrice(
      priceId: params.priceId,
      newPricePerLiter: params.newPricePerLiter,
    );
    // Invalidate related providers
    ref.invalidate(priceUpdateStatusProvider);
    ref.invalidate(latestPricesProvider);
    return response;
  },
);

final priceHistoryByFuelTypeProvider =
    FutureProvider.family<Map<String, dynamic>, ({String fuelType, int days})>(
  (ref, params) async {
    final apiService = ref.watch(apiServiceProvider);
    return apiService.getPriceHistoryByFuelType(
      fuelType: params.fuelType,
      days: params.days,
    );
  },
);
