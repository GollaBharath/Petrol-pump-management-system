import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:petrol_pump_management/models/models.dart';
import 'package:petrol_pump_management/providers/providers.dart';
import 'package:petrol_pump_management/config/app_config.dart';
import 'package:intl/intl.dart';

class PricesScreen extends ConsumerStatefulWidget {
  const PricesScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<PricesScreen> createState() => _PricesScreenState();
}

class _PricesScreenState extends ConsumerState<PricesScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Fuel Prices'),
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Current Prices'),
            Tab(text: 'Price History'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [const _CurrentPricesTab(), const _PriceHistoryTab()],
      ),
    );
  }
}

class _CurrentPricesTab extends ConsumerWidget {
  const _CurrentPricesTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pricesAsync = ref.watch(latestPricesProvider);

    return pricesAsync.when(
      data: (prices) {
        if (prices.isEmpty) {
          return const Center(child: Text('No prices available'));
        }

        return RefreshIndicator(
          onRefresh: () async => await ref.refresh(latestPricesProvider),
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: prices.length,
            itemBuilder: (context, index) {
              final price = prices[index];
              return PriceCard(price: price);
            },
          ),
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stack) => Center(child: Text('Error: $error')),
    );
  }
}

class _PriceHistoryTab extends ConsumerWidget {
  const _PriceHistoryTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final historyAsync = ref.watch(priceHistoryProvider('PETROL'));

    return historyAsync.when(
      data: (history) {
        if (history.isEmpty) {
          return const Center(child: Text('No price history available'));
        }

        return RefreshIndicator(
          onRefresh: () async =>
              await ref.refresh(priceHistoryProvider('PETROL')),
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: history.length,
            itemBuilder: (context, index) {
              final record = history[index];
              return PriceHistoryCard(record: record);
            },
          ),
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stack) => Center(child: Text('Error: $error')),
    );
  }
}

class PriceCard extends StatelessWidget {
  final FuelPrice price;

  const PriceCard({Key? key, required this.price}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  price.fuelType,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: AppConfig.primaryColor,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    '₹${price.pricePerLiter.toStringAsFixed(2)}/L',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Effective From',
                      style: TextStyle(fontSize: 12, color: Colors.grey),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      DateFormat(
                        'dd MMM yyyy, hh:mm a',
                      ).format(price.effectiveFrom ?? DateTime.now()),
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    const Text(
                      'Last Updated',
                      style: TextStyle(fontSize: 12, color: Colors.grey),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      DateFormat('dd MMM yyyy')
                          .format(price.updatedAt ?? DateTime.now()),
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class PriceHistoryCard extends StatelessWidget {
  final dynamic record;

  const PriceHistoryCard({Key? key, required this.record}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Petrol',
                  style: Theme.of(
                    context,
                  ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 4),
                Text(
                  DateFormat('dd MMM yyyy').format(record.effectiveFrom),
                  style: const TextStyle(fontSize: 12, color: Colors.grey),
                ),
              ],
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: AppConfig.primaryColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                '₹${record.pricePerLiter.toStringAsFixed(2)}',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: AppConfig.primaryColor,
                  fontSize: 14,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
