import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:petrol_pump_management/providers/providers.dart';
import 'package:petrol_pump_management/config/app_config.dart';
import 'package:intl/intl.dart';

class BillsScreen extends ConsumerStatefulWidget {
  const BillsScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<BillsScreen> createState() => _BillsScreenState();
}

class _BillsScreenState extends ConsumerState<BillsScreen>
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
        title: const Text('Bills'),
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Pending'),
            Tab(text: 'Paid'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [const _PendingBillsTab(), const _PaidBillsTab()],
      ),
    );
  }
}

class _PendingBillsTab extends ConsumerWidget {
  const _PendingBillsTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final billsAsync = ref.watch(billsProvider);

    return billsAsync.when(
      data: (bills) {
        final pendingBills =
            bills.where((bill) => bill.status != 'PAID').toList();

        if (pendingBills.isEmpty) {
          return const Center(child: Text('No pending bills'));
        }

        return RefreshIndicator(
          onRefresh: () async => await ref.refresh(billsProvider),
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: pendingBills.length,
            itemBuilder: (context, index) {
              final bill = pendingBills[index];
              return BillCard(
                bill: bill,
                isPaid: false,
                onTap: () => _showBillDetail(context, bill),
              );
            },
          ),
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stack) => Center(child: Text('Error: $error')),
    );
  }

  void _showBillDetail(BuildContext context, dynamic bill) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) => BillDetailSheet(bill: bill),
    );
  }
}

class _PaidBillsTab extends ConsumerWidget {
  const _PaidBillsTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final billsAsync = ref.watch(billsProvider);

    return billsAsync.when(
      data: (bills) {
        final paidBills = bills.where((bill) => bill.status == 'PAID').toList();

        if (paidBills.isEmpty) {
          return const Center(child: Text('No paid bills'));
        }

        return RefreshIndicator(
          onRefresh: () async => await ref.refresh(billsProvider),
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: paidBills.length,
            itemBuilder: (context, index) {
              final bill = paidBills[index];
              return BillCard(
                bill: bill,
                isPaid: true,
                onTap: () => _showBillDetail(context, bill),
              );
            },
          ),
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stack) => Center(child: Text('Error: $error')),
    );
  }

  void _showBillDetail(BuildContext context, dynamic bill) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) => BillDetailSheet(bill: bill),
    );
  }
}

class BillCard extends StatelessWidget {
  final dynamic bill;
  final bool isPaid;
  final VoidCallback onTap;

  const BillCard({
    Key? key,
    required this.bill,
    required this.isPaid,
    required this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final statusColor = isPaid
        ? Colors.green
        : (bill.status == 'OVERDUE' ? Colors.red : Colors.orange);

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Bill #${bill.id.substring(0, 8)}',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        DateFormat('dd MMM yyyy').format(bill.createdAt),
                        style: const TextStyle(
                          fontSize: 12,
                          color: Colors.grey,
                        ),
                      ),
                    ],
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
                      bill.status,
                      style: TextStyle(
                        color: statusColor,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.blue.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Amount Due',
                          style: TextStyle(fontSize: 11, color: Colors.grey),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '₹${bill.totalAmount?.toStringAsFixed(2) ?? '0.00'}',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    if (!isPaid)
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          const Text(
                            'Due Date',
                            style: TextStyle(fontSize: 11, color: Colors.grey),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            DateFormat(
                              'dd MMM',
                            ).format(bill.dueDate ?? DateTime.now()),
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class BillDetailSheet extends StatelessWidget {
  final dynamic bill;

  const BillDetailSheet({Key? key, required this.bill}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Bill #${bill.id.substring(0, 8)}',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    DateFormat('dd MMM yyyy').format(bill.createdAt),
                    style: const TextStyle(color: Colors.grey),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: AppConfig.primaryColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  bill.status,
                  style: TextStyle(
                    color: AppConfig.primaryColor,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Amount Details
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  _DetailRow(
                    'Subtotal',
                    '₹${bill.totalAmount?.toStringAsFixed(2) ?? '0.00'}',
                  ),
                  const Divider(height: 16),
                  _DetailRow(
                    'Total Amount',
                    '₹${bill.totalAmount?.toStringAsFixed(2) ?? '0.00'}',
                    isTotal: true,
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Info
          if (bill.status != 'PAID')
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Due Date',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Text(
                  DateFormat(
                    'dd MMMM yyyy',
                  ).format(bill.dueDate ?? DateTime.now()),
                  style: const TextStyle(fontSize: 14),
                ),
                const SizedBox(height: 16),
              ],
            ),

          // Close Button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Close'),
            ),
          ),
        ],
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;
  final bool isTotal;

  const _DetailRow(this.label, this.value, {this.isTotal = false});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: isTotal ? 16 : 14,
            fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: isTotal ? 16 : 14,
            fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
            color: AppConfig.primaryColor,
          ),
        ),
      ],
    );
  }
}
