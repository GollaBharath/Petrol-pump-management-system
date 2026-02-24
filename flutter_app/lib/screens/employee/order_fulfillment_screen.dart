import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:petrol_pump_management/providers/providers.dart';
import 'package:petrol_pump_management/config/app_config.dart';

class OrderFulfillmentScreen extends ConsumerStatefulWidget {
  final String orderId;

  const OrderFulfillmentScreen({Key? key, required this.orderId})
      : super(key: key);

  @override
  ConsumerState<OrderFulfillmentScreen> createState() =>
      _OrderFulfillmentScreenState();
}

class _OrderFulfillmentScreenState
    extends ConsumerState<OrderFulfillmentScreen> {
  late TextEditingController quantityDeliveredController;
  bool isSubmitting = false;

  @override
  void initState() {
    super.initState();
    quantityDeliveredController = TextEditingController();
  }

  @override
  void dispose() {
    quantityDeliveredController.dispose();
    super.dispose();
  }

  void _handleMarkDelivered() async {
    final quantityDelivered = double.tryParse(quantityDeliveredController.text);

    if (quantityDelivered == null || quantityDelivered <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter a valid quantity'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() => isSubmitting = true);

    try {
      await ref.read(
        markOrderDeliveredProvider((
          orderId: widget.orderId,
          quantityDelivered: quantityDelivered,
        )).future,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Order marked as delivered successfully'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.of(context).pop(true); // Return true to indicate success
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
    final orderAsync = ref.watch(orderDetailsProvider(widget.orderId));

    return Scaffold(
      appBar: AppBar(title: const Text('Complete Order'), elevation: 0),
      body: orderAsync.when(
        data: (order) => SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Order Details Card
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Order Details',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 16),
                      _buildDetailRow(
                          'Order ID',
                          order.indentNumber != null
                              ? '#${order.indentNumber}'
                              : '#${order.id.substring(0, 8)}'),
                      const Divider(height: 24),
                      _buildDetailRow('Vehicle', order.vehicleNumber),
                      const Divider(height: 24),
                      _buildDetailRow('Fuel Type', order.fuelType),
                      const Divider(height: 24),
                      _buildDetailRow('Status', order.status,
                          valueColor: order.status == 'PENDING'
                              ? Colors.orange
                              : Colors.green),
                      if (order.quantityRequested != null) ...[
                        const Divider(height: 24),
                        _buildDetailRow('Requested Quantity',
                            '${order.quantityRequested!.toStringAsFixed(2)} L'),
                      ],
                      if (order.amountRequested != null) ...[
                        const Divider(height: 24),
                        _buildDetailRow('Requested Amount',
                            '₹${order.amountRequested!.toStringAsFixed(2)}'),
                      ],
                      if (order.cash > 0) ...[
                        const Divider(height: 24),
                        _buildDetailRow('Cash', '₹${order.cash}',
                            valueColor: Colors.green),
                      ],
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Quantity Input Section
              const Text(
                'Quantity Delivered',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: quantityDeliveredController,
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
                enabled: !isSubmitting && order.status == 'PENDING',
                decoration: InputDecoration(
                  hintText: 'Enter quantity in liters',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                  prefixIcon: const Icon(Icons.local_gas_station),
                  suffixText: 'L',
                  filled: true,
                  fillColor: Colors.grey[50],
                ),
              ),
              const SizedBox(height: 24),

              // Action Button
              if (order.status == 'PENDING')
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: isSubmitting ? null : _handleMarkDelivered,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppConfig.primaryColor,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: isSubmitting
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Text(
                            'Mark as Delivered',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                  ),
                )
              else
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.green[50],
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.green),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.check_circle, color: Colors.green),
                      const SizedBox(width: 12),
                      Text(
                        'Order already ${order.status.toLowerCase()}',
                        style: const TextStyle(
                          color: Colors.green,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, size: 64, color: Colors.red),
                const SizedBox(height: 16),
                const Text(
                  'Failed to load order',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Text(
                  error.toString(),
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.grey),
                ),
                const SizedBox(height: 24),
                ElevatedButton.icon(
                  onPressed: () =>
                      ref.invalidate(orderDetailsProvider(widget.orderId)),
                  icon: const Icon(Icons.refresh),
                  label: const Text('Retry'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value, {Color? valueColor}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 14,
            color: Colors.grey,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: valueColor ?? Colors.black87,
          ),
        ),
      ],
    );
  }
}
