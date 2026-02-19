import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:petrol_pump_management/providers/providers.dart';
import 'package:petrol_pump_management/config/app_config.dart';
import 'package:intl/intl.dart';

class PriceManagementScreen extends ConsumerStatefulWidget {
  const PriceManagementScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<PriceManagementScreen> createState() =>
      _PriceManagementScreenState();
}

class _PriceManagementScreenState extends ConsumerState<PriceManagementScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
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
        title: const Text('Price Management'),
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Status'),
            Tab(text: 'Set Price'),
            Tab(text: 'History'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          const _StatusTab(),
          const _SetPriceTab(),
          const _HistoryTab(),
        ],
      ),
    );
  }
}

class _StatusTab extends ConsumerWidget {
  const _StatusTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statusAsync = ref.watch(priceUpdateStatusProvider);

    return statusAsync.when(
      data: (data) {
        final status = data['status'] as List? ?? [];

        return RefreshIndicator(
          onRefresh: () async => await ref.refresh(priceUpdateStatusProvider),
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text(
                'Price Update Status',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 16),
              ...status.map((fuelStatus) {
                final fuelType = fuelStatus['fuelType'] as String?;
                final currentPrice = fuelStatus['currentPrice'] as num?;
                final needsUpdate = fuelStatus['needsUpdate'] as bool? ?? false;
                final hoursOverdue = fuelStatus['hoursOverdue'] as int? ?? 0;
                final lastUpdated = fuelStatus['lastUpdated'] as String?;

                final statusColor = needsUpdate ? Colors.red : Colors.green;
                final statusText =
                    needsUpdate ? 'Overdue by ${hoursOverdue}h' : 'Updated';

                return Card(
                  margin: const EdgeInsets.only(bottom: 16),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              fuelType ?? 'Unknown',
                              style: Theme.of(context)
                                  .textTheme
                                  .titleMedium
                                  ?.copyWith(
                                    fontWeight: FontWeight.bold,
                                  ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 6,
                              ),
                              decoration: BoxDecoration(
                                color: statusColor.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(
                                statusText,
                                style: TextStyle(
                                  color: statusColor,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12,
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
                                  'Current Price',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Colors.grey,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  currentPrice != null
                                      ? '₹${currentPrice.toStringAsFixed(2)}/L'
                                      : 'No price set',
                                  style:
                                      Theme.of(context).textTheme.titleMedium,
                                ),
                              ],
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                const Text(
                                  'Last Updated',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Colors.grey,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  lastUpdated != null
                                      ? DateFormat('dd MMM, HH:mm')
                                          .format(DateTime.parse(lastUpdated))
                                      : 'Never',
                                  style: Theme.of(context).textTheme.bodySmall,
                                ),
                              ],
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ],
          ),
        );
      },
      loading: () => const Center(
        child: CircularProgressIndicator(),
      ),
      error: (error, stack) => Center(
        child: Text('Error: $error'),
      ),
    );
  }
}

class _SetPriceTab extends ConsumerStatefulWidget {
  const _SetPriceTab();

  @override
  ConsumerState<_SetPriceTab> createState() => _SetPriceTabState();
}

class _SetPriceTabState extends ConsumerState<_SetPriceTab> {
  String? selectedFuelType;
  final priceController = TextEditingController();
  bool isSubmitting = false;

  @override
  void dispose() {
    priceController.dispose();
    super.dispose();
  }

  void _handleSetPrice() async {
    if (selectedFuelType == null || priceController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select fuel type and enter price'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    final price = double.tryParse(priceController.text);
    if (price == null || price <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter a valid price'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() => isSubmitting = true);

    try {
      await ref.read(setDailyPriceProvider((
        fuelType: selectedFuelType!,
        pricePerLiter: price,
        date: null,
      )).future);

      if (mounted) {
        priceController.clear();
        setState(() => selectedFuelType = null);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Price set successfully'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $error'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Set Daily Fuel Price',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 24),

          // Fuel Type Selection
          Text(
            'Fuel Type',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          SegmentedButton<String>(
            segments: const [
              ButtonSegment(label: Text('Petrol'), value: 'PETROL'),
              ButtonSegment(label: Text('Diesel'), value: 'DIESEL'),
            ],
            selected: selectedFuelType != null ? {selectedFuelType!} : {},
            onSelectionChanged: (selected) {
              setState(() => selectedFuelType = selected.first);
            },
          ),
          const SizedBox(height: 24),

          // Price Input
          Text(
            'Price Per Liter (₹)',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          TextField(
            controller: priceController,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            enabled: !isSubmitting,
            decoration: InputDecoration(
              hintText: 'Enter price per liter',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
              ),
              prefixText: '₹',
              suffixText: '/L',
            ),
          ),
          const SizedBox(height: 32),

          // Warning
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.orange.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                const Icon(Icons.info_outline, color: Colors.orange),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Only one price can be set per fuel type per 24 hours',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.orange.shade700,
                        ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),

          // Submit Button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: isSubmitting ? null : _handleSetPrice,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                backgroundColor: AppConfig.primaryColor,
              ),
              child: isSubmitting
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : const Text(
                      'Set Price',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}

class _HistoryTab extends ConsumerStatefulWidget {
  const _HistoryTab();

  @override
  ConsumerState<_HistoryTab> createState() => _HistoryTabState();
}

class _HistoryTabState extends ConsumerState<_HistoryTab> {
  String selectedFuelType = 'PETROL';
  int selectedDays = 30;

  @override
  Widget build(BuildContext context) {
    final historyAsync = ref.watch(
      priceHistoryByFuelTypeProvider((
        fuelType: selectedFuelType,
        days: selectedDays,
      )),
    );

    return Column(
      children: [
        // Filters
        Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Fuel Type',
                style: Theme.of(context).textTheme.titleSmall,
              ),
              const SizedBox(height: 8),
              SegmentedButton<String>(
                segments: const [
                  ButtonSegment(label: Text('Petrol'), value: 'PETROL'),
                  ButtonSegment(label: Text('Diesel'), value: 'DIESEL'),
                ],
                selected: {selectedFuelType},
                onSelectionChanged: (selected) {
                  setState(() => selectedFuelType = selected.first);
                },
              ),
              const SizedBox(height: 16),
              Text(
                'Time Period',
                style: Theme.of(context).textTheme.titleSmall,
              ),
              const SizedBox(height: 8),
              SegmentedButton<int>(
                segments: const [
                  ButtonSegment(label: Text('7 days'), value: 7),
                  ButtonSegment(label: Text('30 days'), value: 30),
                  ButtonSegment(label: Text('90 days'), value: 90),
                ],
                selected: {selectedDays},
                onSelectionChanged: (selected) {
                  setState(() => selectedDays = selected.first);
                },
              ),
            ],
          ),
        ),
        // History List
        Expanded(
          child: historyAsync.when(
            data: (data) {
              final history = data['history'] as List? ?? [];

              if (history.isEmpty) {
                return const Center(
                  child: Text('No price history available'),
                );
              }

              return RefreshIndicator(
                onRefresh: () async => await ref.refresh(
                  priceHistoryByFuelTypeProvider((
                    fuelType: selectedFuelType,
                    days: selectedDays,
                  )),
                ),
                child: ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: history.length,
                  itemBuilder: (context, index) {
                    final record = history[index];
                    final price = record['pricePerLiter'] as num?;
                    final date = record['date'] as String?;

                    return Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              DateFormat('dd MMM yyyy')
                                  .format(DateTime.parse(date ?? '')),
                              style: Theme.of(context)
                                  .textTheme
                                  .bodyMedium
                                  ?.copyWith(
                                    fontWeight: FontWeight.w500,
                                  ),
                            ),
                            Text(
                              '₹${price?.toStringAsFixed(2) ?? '0.00'}/L',
                              style: Theme.of(context)
                                  .textTheme
                                  .titleMedium
                                  ?.copyWith(
                                    color: AppConfig.primaryColor,
                                  ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              );
            },
            loading: () => const Center(
              child: CircularProgressIndicator(),
            ),
            error: (error, stack) => Center(
              child: Text('Error: $error'),
            ),
          ),
        ),
      ],
    );
  }
}
