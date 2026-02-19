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
      final result = await ref.read(
        markOrderDeliveredProvider((
          orderId: widget.orderId,
          quantityDelivered: quantityDelivered,
        )).future,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Order marked as delivered'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.of(context).pop();
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $error'), backgroundColor: Colors.red),
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
    return Scaffold(
      appBar: AppBar(title: const Text('Complete Order'), elevation: 0),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Order Details Section
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
                    _DetailRow('Order ID', widget.orderId.substring(0, 8)),
                    const SizedBox(height: 12),
                    _DetailRow('Status', 'PENDING', color: Colors.orange),
                    const SizedBox(height: 12),
                    _DetailRow('Fuel Type', 'PETROL'),
                    const SizedBox(height: 12),
                    _DetailRow('Vehicle', 'MH-01-AB-1234'),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Quantity Delivered Input
            Text(
              'Quantity Delivered (Liters)',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            TextField(
              controller: quantityDeliveredController,
              keyboardType: const TextInputType.numberWithOptions(
                decimal: true,
              ),
              enabled: !isSubmitting,
              decoration: InputDecoration(
                hintText: 'Enter quantity delivered',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                prefixIcon: const Icon(Icons.local_gas_station),
                suffixText: 'L',
              ),
            ),
            const SizedBox(height: 24),

            // Charges Section
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Charges Summary',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Unit Price:'),
                        Text(
                          '₹ 95.50',
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Quantity:'),
                        Text(
                          '${quantityDeliveredController.text.isEmpty ? '0' : quantityDeliveredController.text} L',
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                      ],
                    ),
                    const Divider(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Total Amount:',
                          style: TextStyle(fontWeight: FontWeight.bold),
                        ),
                        Text(
                          '₹ 0.00',
                          style: Theme.of(context).textTheme.headlineSmall,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Submit Button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: isSubmitting ? null : _handleMarkDelivered,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  backgroundColor: AppConfig.primaryColor,
                  disabledBackgroundColor: Colors.grey,
                ),
                child: isSubmitting
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(
                            Colors.white,
                          ),
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
            ),
          ],
        ),
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;
  final Color? color;

  const _DetailRow(this.label, this.value, {this.color});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontSize: 14, color: Colors.grey)),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: (color ?? Colors.blue).withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            value,
            style: TextStyle(
              fontWeight: FontWeight.bold,
              color: color ?? Colors.blue,
            ),
          ),
        ),
      ],
    );
  }
}
