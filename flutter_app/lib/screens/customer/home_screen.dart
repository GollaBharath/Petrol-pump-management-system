import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:petrol_pump_management/config/app_config.dart';
import 'package:petrol_pump_management/providers/auth_provider.dart';
import 'package:petrol_pump_management/providers/providers.dart';
import 'package:petrol_pump_management/routes/app_routes.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userRole = ref.watch(userRoleProvider);
    final isCustomer = ref.watch(isCustomerProvider);
    final isEmployee = ref.watch(isEmployeeProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Petrol Pump Management'),
        elevation: 0,
        actions: [
          IconButton(
            onPressed: () async {
              await ref.read(logoutProvider.future);
              if (context.mounted) {
                Navigator.of(context).pushReplacementNamed(AppRoutes.login);
              }
            },
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Welcome',
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 32),
              if (isCustomer) ...[
                _buildCustomerMenu(context),
              ] else if (isEmployee) ...[
                _buildEmployeeMenu(context),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCustomerMenu(BuildContext context) {
    return Column(
      children: [
        MenuCard(
          icon: Icons.add_circle,
          title: 'Place Order',
          subtitle: 'Order fuel by amount or quantity',
          onTap: () {
            Navigator.of(context).pushNamed(AppRoutes.orderPlacement);
          },
        ),
        const SizedBox(height: 16),
        MenuCard(
          icon: Icons.list,
          title: 'My Orders',
          subtitle: 'View your order history',
          onTap: () {
            Navigator.of(context).pushNamed(AppRoutes.myOrders);
          },
        ),
      ],
    );
  }

  Widget _buildEmployeeMenu(BuildContext context) {
    return Column(
      children: [
        MenuCard(
          icon: Icons.assignment,
          title: 'Pending Orders',
          subtitle: 'View and fulfill pending orders',
          onTap: () {
            Navigator.of(context).pushNamed(AppRoutes.pendingOrders);
          },
        ),
        const SizedBox(height: 16),
        MenuCard(
          icon: Icons.local_gas_station,
          title: 'Fuel Prices',
          subtitle: 'View current fuel prices',
          onTap: () {
            Navigator.of(context).pushNamed(AppRoutes.prices);
          },
        ),
      ],
    );
  }
}

class MenuCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const MenuCard({
    Key? key,
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppConfig.primaryColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: AppConfig.primaryColor, size: 32),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: const TextStyle(fontSize: 12, color: Colors.grey),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.arrow_forward_ios, color: Colors.grey, size: 16),
            ],
          ),
        ),
      ),
    );
  }
}
