import 'package:flutter/material.dart';
import 'package:petrol_pump_management/screens/auth/login_screen.dart';
import 'package:petrol_pump_management/screens/auth/signup_screen.dart';
import 'package:petrol_pump_management/screens/customer/home_screen.dart';
import 'package:petrol_pump_management/screens/customer/order_placement_screen.dart';
import 'package:petrol_pump_management/screens/customer/my_orders_screen.dart';
import 'package:petrol_pump_management/screens/employee/pending_orders_screen.dart';
import 'package:petrol_pump_management/screens/employee/order_fulfillment_screen.dart';
import 'package:petrol_pump_management/screens/employee/home_screen.dart'
    as employee;
import 'package:petrol_pump_management/screens/employee/cash_advance_screen.dart';
import 'package:petrol_pump_management/screens/admin/price_management_screen.dart';
import 'package:petrol_pump_management/screens/shared/prices_screen.dart';
import 'package:petrol_pump_management/screens/shared/bills_screen.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:petrol_pump_management/providers/auth_provider.dart';

class AuthChecker extends ConsumerWidget {
  const AuthChecker({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authStateProvider);

    return authState.when(
      data: (user) {
        if (user == null) {
          return const LoginScreen();
        }
        if (user.role == 'EMPLOYEE' || user.role == 'ADMIN') {
          return const employee.EmployeeHomeScreen();
        }
        return const HomeScreen(); // Default to customer
      },
      loading: () => const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      ),
      error: (e, st) => const LoginScreen(),
    );
  }
}

class AppRoutes {
  static const String login = '/login';
  static const String signup = '/signup';
  static const String home = '/home';
  static const String employeeHome = '/employee-home';
  static const String orderPlacement = '/order-placement';
  static const String myOrders = '/my-orders';
  static const String orderDetails = '/order-details';
  static const String pendingOrders = '/pending-orders';
  static const String orderFulfillment = '/order-fulfillment';
  static const String prices = '/prices';
  static const String bills = '/bills';
  static const String cashAdvance = '/cash-advance';
  static const String priceManagement = '/price-management';

  static const String root = '/';

  static final Map<String, WidgetBuilder> routes = {
    root: (context) => const AuthChecker(),
    login: (context) => const LoginScreen(),
    signup: (context) => const SignupScreen(),
    home: (context) => const HomeScreen(),
    employeeHome: (context) => const employee.EmployeeHomeScreen(),
    orderPlacement: (context) => const OrderPlacementScreen(),
    myOrders: (context) => const MyOrdersScreen(),
    pendingOrders: (context) => const PendingOrdersScreen(),
    prices: (context) => const PricesScreen(),
    bills: (context) => const BillsScreen(),
    cashAdvance: (context) => const CashAdvanceScreen(),
    priceManagement: (context) => const PriceManagementScreen(),
  };

  static Route<dynamic>? onGenerateRoute(RouteSettings settings) {
    switch (settings.name) {
      case orderDetails:
        final orderId = settings.arguments as String?;
        return MaterialPageRoute(
          builder: (context) => OrderDetailsScreen(orderId: orderId ?? ''),
        );
      case orderFulfillment:
        final orderId = settings.arguments as String?;
        return MaterialPageRoute(
          builder: (context) => OrderFulfillmentScreen(orderId: orderId ?? ''),
        );
      default:
        return null;
    }
  }
}
