import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:petrol_pump_management/providers/providers.dart';
import 'package:petrol_pump_management/providers/auth_provider.dart';
import 'package:petrol_pump_management/config/app_config.dart';
import 'package:intl/intl.dart';

class CashAdvanceScreen extends ConsumerStatefulWidget {
  const CashAdvanceScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<CashAdvanceScreen> createState() => _CashAdvanceScreenState();
}

class _CashAdvanceScreenState extends ConsumerState<CashAdvanceScreen>
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
    final authState = ref.watch(authProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Cash Advance Management'),
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'My Summary'),
            Tab(text: 'Pending'),
          ],
        ),
      ),
      body: authState != null
          ? TabBarView(
              controller: _tabController,
              children: [
                _MySummaryTab(userId: authState!.id),
                const _PendingTab(),
              ],
            )
          : const Center(child: Text('Not logged in')),
    );
  }
}

class _MySummaryTab extends ConsumerWidget {
  final String userId;

  const _MySummaryTab({required this.userId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final summaryAsync = ref.watch(employeeCashAdvanceSummaryProvider(userId));

    return summaryAsync.when(
      data: (summary) {
        final totalDisbursed = summary['totalDisbursed'] ?? 0.0;
        final totalReconciled = summary['totalReconciled'] ?? 0.0;
        final outstanding = summary['outstandingAmount'] ?? 0.0;

        return SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Summary Cards
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      _SummaryRow(
                        'Total Disbursed',
                        '₹${totalDisbursed.toStringAsFixed(2)}',
                        Colors.blue,
                      ),
                      const Divider(height: 16),
                      _SummaryRow(
                        'Total Reconciled',
                        '₹${totalReconciled.toStringAsFixed(2)}',
                        Colors.green,
                      ),
                      const Divider(height: 16),
                      _SummaryRow(
                        'Outstanding',
                        '₹${outstanding.toStringAsFixed(2)}',
                        Colors.orange,
                        isHighlight: true,
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Recent Transactions
              Text(
                'Recent Transactions',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 12),

              if (summary['transactions'] != null &&
                  (summary['transactions'] as List).isNotEmpty)
                ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: summary['transactions'].length,
                  itemBuilder: (context, index) {
                    final transaction = summary['transactions'][index];
                    return _TransactionCard(
                      transaction: transaction,
                    );
                  },
                )
              else
                const Center(
                  child: Text('No transactions'),
                ),
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

class _PendingTab extends ConsumerWidget {
  const _PendingTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pendingAsync = ref.watch(pendingCashAdvancesProvider);

    return pendingAsync.when(
      data: (data) {
        final transactions = data['transactions'] ?? [];
        final totalOutstanding = data['totalOutstanding'] ?? 0.0;

        return RefreshIndicator(
          onRefresh: () async => await ref.refresh(pendingCashAdvancesProvider),
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Summary Card
                Card(
                  color: Colors.orange.withOpacity(0.1),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Pending Cash Advances',
                              style: TextStyle(
                                fontSize: 14,
                                color: Colors.grey,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              '${transactions.length} orders',
                              style: Theme.of(context).textTheme.headlineSmall,
                            ),
                          ],
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            const Text(
                              'Total Outstanding',
                              style: TextStyle(
                                fontSize: 14,
                                color: Colors.grey,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              '₹${totalOutstanding.toStringAsFixed(2)}',
                              style: Theme.of(context)
                                  .textTheme
                                  .headlineSmall
                                  ?.copyWith(color: Colors.orange),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Transactions List
                if (transactions.isNotEmpty)
                  ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: transactions.length,
                    itemBuilder: (context, index) {
                      final transaction = transactions[index];
                      return _PendingTransactionCard(
                        transaction: transaction,
                      );
                    },
                  )
                else
                  const Center(
                    child: Padding(
                      padding: EdgeInsets.all(32),
                      child: Text('No pending cash advances'),
                    ),
                  ),
              ],
            ),
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

class _TransactionCard extends StatelessWidget {
  final dynamic transaction;

  const _TransactionCard({required this.transaction});

  @override
  Widget build(BuildContext context) {
    final type = transaction['transactionType'] as String? ?? 'UNKNOWN';
    final amount = (transaction['amount'] as num?)?.toDouble() ?? 0.0;
    final description = transaction['description'] as String? ?? '';

    final typeColor = type == 'DISBURSED'
        ? Colors.blue
        : type == 'RECONCILED'
            ? Colors.green
            : Colors.grey;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    description.isNotEmpty ? description : 'Cash Advance',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    DateFormat('dd MMM yyyy, hh:mm a')
                        .format(DateTime.parse(transaction['createdAt'])),
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.grey,
                        ),
                  ),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  '₹${amount.toStringAsFixed(2)}',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: typeColor,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: typeColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    type,
                    style: TextStyle(
                      color: typeColor,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _PendingTransactionCard extends StatelessWidget {
  final dynamic transaction;

  const _PendingTransactionCard({required this.transaction});

  @override
  Widget build(BuildContext context) {
    final amount = (transaction['amount'] as num?)?.toDouble() ?? 0.0;
    final employeeName = transaction['employee']?['fullName'] ?? 'Unknown';
    final createdAt = transaction['createdAt'] as String?;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    employeeName,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                Text(
                  '₹${amount.toStringAsFixed(2)}',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                    color: Colors.orange,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              DateFormat('dd MMM yyyy').format(
                DateTime.parse(createdAt ?? DateTime.now().toIso8601String()),
              ),
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.grey,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  final bool isHighlight;

  const _SummaryRow(
    this.label,
    this.value,
    this.color, {
    this.isHighlight = false,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: isHighlight ? 16 : 14,
            fontWeight: isHighlight ? FontWeight.bold : FontWeight.normal,
            color: Colors.grey,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: isHighlight ? 18 : 16,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
      ],
    );
  }
}
