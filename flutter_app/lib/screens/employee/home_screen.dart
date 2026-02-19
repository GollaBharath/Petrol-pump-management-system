import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:petrol_pump_management/providers/auth_provider.dart';
import 'package:petrol_pump_management/routes/app_routes.dart';
import 'package:petrol_pump_management/config/app_config.dart';

class EmployeeHomeScreen extends ConsumerWidget {
  const EmployeeHomeScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authNotifierProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Employee Dashboard'),
        elevation: 0,
        actions: [
          PopupMenuButton(
            itemBuilder: (context) => [
              PopupMenuItem(
                child: const Text('Logout'),
                onTap: () {
                  ref.read(authNotifierProvider.notifier).logout();
                  Navigator.of(context).pushReplacementNamed(AppRoutes.login);
                },
              ),
            ],
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Welcome Section
            Card(
              color: AppConfig.primaryColor,
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Welcome Back!',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      authState?.fullName ?? 'Employee',
                      style: const TextStyle(
                        fontSize: 16,
                        color: Colors.white70,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Menu Section
            Text('Operations', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 16),

            // Quick Actions Grid
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              children: [
                _MenuCard(
                  icon: Icons.pending_actions,
                  title: 'Pending Orders',
                  subtitle: 'View & fulfill orders',
                  onTap: () {
                    Navigator.of(context).pushNamed(AppRoutes.pendingOrders);
                  },
                ),
                _MenuCard(
                  icon: Icons.local_gas_station,
                  title: 'Fuel Prices',
                  subtitle: 'Current & history',
                  onTap: () {
                    Navigator.of(context).pushNamed(AppRoutes.prices);
                  },
                ),
                _MenuCard(
                  icon: Icons.receipt,
                  title: 'Billing',
                  subtitle: 'View bills & payments',
                  onTap: () {
                    Navigator.of(context).pushNamed(AppRoutes.bills);
                  },
                ),
                _MenuCard(
                  icon: Icons.payments,
                  title: 'Cash Advance',
                  subtitle: 'Track & reconcile',
                  onTap: () {
                    Navigator.of(context).pushNamed(AppRoutes.cashAdvance);
                  },
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Statistics Section
            _StatisticsCard(),
          ],
        ),
      ),
    );
  }
}

class _MenuCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _MenuCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Card(
        elevation: 2,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, size: 32, color: AppConfig.primaryColor),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 14,
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
            ],
          ),
        ),
      ),
    );
  }
}

class _StatisticsCard extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Today\'s Summary',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _StatItem(label: 'Orders', value: '24', color: Colors.blue),
                _StatItem(label: 'Completed', value: '18', color: Colors.green),
                _StatItem(label: 'Pending', value: '6', color: Colors.orange),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _StatItem extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _StatItem({
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        const SizedBox(height: 4),
        Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
      ],
    );
  }
}
