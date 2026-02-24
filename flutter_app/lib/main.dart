import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:petrol_pump_management/config/app_config.dart';
import 'package:petrol_pump_management/routes/app_routes.dart';
import 'package:petrol_pump_management/providers/auth_provider.dart';
import 'package:petrol_pump_management/screens/auth/login_screen.dart';
import 'package:petrol_pump_management/screens/customer/home_screen.dart'
    as customer;
import 'package:petrol_pump_management/screens/employee/home_screen.dart'
    as employee;

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ProviderScope(child: PetrolPumpApp()));
}

class PetrolPumpApp extends ConsumerWidget {
  const PetrolPumpApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authStateProvider);

    return MaterialApp(
      title: 'Petrol Pump Management',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: AppConfig.primaryColor,
          brightness: Brightness.light,
        ),
        useMaterial3: true,
        fontFamily: 'Roboto',
      ),
      initialRoute: AppRoutes.root,
      routes: AppRoutes.routes,
      onGenerateRoute: AppRoutes.onGenerateRoute,
    );
  }
}

class SplashScreen extends StatelessWidget {
  const SplashScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.local_gas_station,
              size: 80,
              color: AppConfig.primaryColor,
            ),
            const SizedBox(height: 24),
            const Text(
              'Petrol Pump Management',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 32),
            const CircularProgressIndicator(color: AppConfig.primaryColor),
          ],
        ),
      ),
    );
  }
}
