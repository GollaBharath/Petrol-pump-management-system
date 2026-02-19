import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:petrol_pump_management/config/app_config.dart';
import 'package:petrol_pump_management/providers/providers.dart';

class OrderPlacementScreen extends ConsumerStatefulWidget {
  const OrderPlacementScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<OrderPlacementScreen> createState() =>
      _OrderPlacementScreenState();
}

class _OrderPlacementScreenState extends ConsumerState<OrderPlacementScreen> {
  final _vehicleController = TextEditingController();
  final _amountController = TextEditingController();
  final _quantityController = TextEditingController();
  final _cashAdvanceController = TextEditingController();

  String _selectedFuelType = 'PETROL';
  String _orderType = 'QUANTITY'; // QUANTITY or AMOUNT
  bool _isLoading = false;

  @override
  void dispose() {
    _vehicleController.dispose();
    _amountController.dispose();
    _quantityController.dispose();
    _cashAdvanceController.dispose();
    super.dispose();
  }

  Future<void> _handleCreateOrder() async {
    if (_vehicleController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter vehicle number')),
      );
      return;
    }

    if (_orderType == 'QUANTITY' && _quantityController.text.isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Please enter quantity')));
      return;
    }

    if (_orderType == 'AMOUNT' && _amountController.text.isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Please enter amount')));
      return;
    }

    setState(() => _isLoading = true);

    try {
      await ref.read(
        createOrderProvider((
          vehicleNumber: _vehicleController.text,
          fuelType: _selectedFuelType,
          quantityRequested: _orderType == 'QUANTITY'
              ? double.tryParse(_quantityController.text)
              : null,
          amountRequested: _orderType == 'AMOUNT'
              ? double.tryParse(_amountController.text)
              : null,
          cashAdvance: double.tryParse(_cashAdvanceController.text) ?? 0,
        )).future,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Order placed successfully')),
        );
        Navigator.of(context).pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Order failed: $e')));
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Place Order'), elevation: 0),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 16),
              const Text(
                'Vehicle Details',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _vehicleController,
                decoration: InputDecoration(
                  hintText: 'Vehicle Number (e.g., DL01AB1234)',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              const Text(
                'Fuel Type',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              SegmentedButton<String>(
                segments: const <ButtonSegment<String>>[
                  ButtonSegment<String>(value: 'PETROL', label: Text('Petrol')),
                  ButtonSegment<String>(value: 'DIESEL', label: Text('Diesel')),
                ],
                selected: <String>{_selectedFuelType},
                onSelectionChanged: (Set<String> newSelection) {
                  setState(() => _selectedFuelType = newSelection.first);
                },
              ),
              const SizedBox(height: 24),
              const Text(
                'Order Type',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              SegmentedButton<String>(
                segments: const <ButtonSegment<String>>[
                  ButtonSegment<String>(
                    value: 'QUANTITY',
                    label: Text('By Quantity'),
                  ),
                  ButtonSegment<String>(
                    value: 'AMOUNT',
                    label: Text('By Amount'),
                  ),
                ],
                selected: <String>{_orderType},
                onSelectionChanged: (Set<String> newSelection) {
                  setState(() => _orderType = newSelection.first);
                },
              ),
              const SizedBox(height: 24),
              if (_orderType == 'QUANTITY') ...[
                const Text(
                  'Quantity (Liters)',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _quantityController,
                  decoration: InputDecoration(
                    hintText: 'Enter quantity in liters',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  keyboardType: TextInputType.number,
                ),
              ] else ...[
                const Text(
                  'Amount (₹)',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _amountController,
                  decoration: InputDecoration(
                    hintText: 'Enter amount in rupees',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  keyboardType: TextInputType.number,
                ),
              ],
              const SizedBox(height: 24),
              const Text(
                'Cash Advance (Optional)',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _cashAdvanceController,
                decoration: InputDecoration(
                  hintText: 'Enter cash advance amount',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _handleCreateOrder,
                  style: ElevatedButton.styleFrom(
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: _isLoading
                      ? const CircularProgressIndicator(color: Colors.white)
                      : const Text(
                          'Place Order',
                          style: TextStyle(fontSize: 16),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
