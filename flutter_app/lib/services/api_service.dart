import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:petrol_pump_management/config/app_config.dart';
import 'package:petrol_pump_management/models/models.dart';

class ApiService {
  late final Dio _dio;
  final _secureStorage = const FlutterSecureStorage();

  ApiService() {
    _dio = Dio(
      BaseOptions(
        baseUrl: AppConfig.apiBaseUrl,
        connectTimeout: AppConfig.connectTimeout,
        receiveTimeout: AppConfig.apiTimeout,
        contentType: 'application/json',
      ),
    );

    // Add interceptors
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // Add auth token to requests
          final token = await _secureStorage.read(
            key: AppConfig.accessTokenKey,
          );
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (error, handler) {
          // Handle 401 errors
          if (error.response?.statusCode == 401) {
            // Token expired, logout user
            _secureStorage.delete(key: AppConfig.accessTokenKey);
          }
          return handler.next(error);
        },
      ),
    );
  }

  // Auth endpoints
  Future<Map<String, dynamic>> signup({
    required String email,
    required String password,
    required String fullName,
    required String phone,
    required String role,
  }) async {
    try {
      final response = await _dio.post(
        '/api/auth/signup',
        data: {
          'email': email,
          'password': password,
          'fullName': fullName,
          'phone': phone,
          'role': role,
        },
      );
      return response.data;
    } catch (e) {
      rethrow;
    }
  }

  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _dio.post(
        '/api/auth/login',
        data: {'email': email, 'password': password},
      );

      final data = response.data;
      if (data['session'] != null) {
        await _secureStorage.write(
          key: AppConfig.accessTokenKey,
          value: data['session']['accessToken'],
        );
        await _secureStorage.write(
          key: AppConfig.refreshTokenKey,
          value: data['session']['refreshToken'],
        );
      }

      return data;
    } catch (e) {
      rethrow;
    }
  }

  Future<void> logout() async {
    await _secureStorage.delete(key: AppConfig.accessTokenKey);
    await _secureStorage.delete(key: AppConfig.refreshTokenKey);
  }

  // Order endpoints
  Future<Order> createOrder({
    required String vehicleNumber,
    required String fuelType,
    double? amountRequested,
    double? quantityRequested,
    required double cashAdvance,
  }) async {
    try {
      final response = await _dio.post(
        '/api/orders',
        data: {
          'vehicleNumber': vehicleNumber,
          'fuelType': fuelType,
          'amountRequested': amountRequested,
          'quantityRequested': quantityRequested,
          'cashAdvance': cashAdvance,
        },
      );
      return Order.fromJson(response.data['order']);
    } catch (e) {
      rethrow;
    }
  }

  Future<List<Order>> getOrders({int limit = 20, int offset = 0}) async {
    try {
      final response = await _dio.get(
        '/api/orders',
        queryParameters: {'limit': limit, 'offset': offset},
      );
      final orders = (response.data['orders'] as List)
          .map((order) => Order.fromJson(order as Map<String, dynamic>))
          .toList();
      return orders;
    } catch (e) {
      rethrow;
    }
  }

  Future<List<Order>> getPendingOrders() async {
    try {
      final response = await _dio.get('/api/orders/pending');
      final orders = (response.data['orders'] as List)
          .map((order) => Order.fromJson(order as Map<String, dynamic>))
          .toList();
      return orders;
    } catch (e) {
      rethrow;
    }
  }

  Future<Order> getOrderDetails(String orderId) async {
    try {
      final response = await _dio.get('/api/orders/$orderId');
      return Order.fromJson(response.data['order']);
    } catch (e) {
      rethrow;
    }
  }

  Future<Order> markOrderDelivered(
    String orderId,
    double quantityDelivered,
  ) async {
    try {
      final response = await _dio.patch(
        '/api/orders/$orderId',
        data: {'quantityDelivered': quantityDelivered},
      );
      return Order.fromJson(response.data['order']);
    } catch (e) {
      rethrow;
    }
  }

  // Price endpoints
  Future<List<FuelPrice>> getLatestPrices() async {
    try {
      final response = await _dio.get('/api/prices');
      final prices = (response.data['prices'] as List)
          .map((price) => FuelPrice.fromJson(price as Map<String, dynamic>))
          .toList();
      return prices;
    } catch (e) {
      rethrow;
    }
  }

  Future<List<FuelPrice>> getPriceHistory({
    String? fuelType,
    int limit = 30,
    int offset = 0,
  }) async {
    try {
      final response = await _dio.get(
        '/api/prices/history',
        queryParameters: {
          if (fuelType != null) 'fuelType': fuelType,
          'limit': limit,
          'offset': offset,
        },
      );
      final prices = (response.data['prices'] as List)
          .map((price) => FuelPrice.fromJson(price as Map<String, dynamic>))
          .toList();
      return prices;
    } catch (e) {
      rethrow;
    }
  }

  // Bill endpoints
  Future<Bill> getBillDetails(String billId) async {
    try {
      final response = await _dio.get('/api/bills/$billId');
      return Bill.fromJson(response.data['bill']);
    } catch (e) {
      rethrow;
    }
  }

  Future<List<Bill>> getBills({int limit = 20, int offset = 0}) async {
    try {
      final response = await _dio.get(
        '/api/bills',
        queryParameters: {'limit': limit, 'offset': offset},
      );
      final bills = (response.data['bills'] as List)
          .map((bill) => Bill.fromJson(bill as Map<String, dynamic>))
          .toList();
      return bills;
    } catch (e) {
      rethrow;
    }
  }

  // Cash Advance endpoints
  Future<Map<String, dynamic>> disburseCashAdvance({
    required String orderId,
    required String employeeId,
    required double amount,
    String? description,
  }) async {
    try {
      final response = await _dio.post(
        '/api/cash-advances',
        data: {
          'orderId': orderId,
          'employeeId': employeeId,
          'amount': amount,
          if (description != null) 'description': description,
        },
      );
      return response.data;
    } catch (e) {
      rethrow;
    }
  }

  Future<Map<String, dynamic>> getEmployeeCashAdvanceSummary(
    String employeeId,
  ) async {
    try {
      final response = await _dio.get(
        '/api/cash-advances/$employeeId',
      );
      return response.data;
    } catch (e) {
      rethrow;
    }
  }

  Future<Map<String, dynamic>> getPendingCashAdvances() async {
    try {
      final response = await _dio.get(
        '/api/cash-advances/report',
        queryParameters: {'type': 'pending'},
      );
      return response.data;
    } catch (e) {
      rethrow;
    }
  }

  Future<Map<String, dynamic>> getCashAdvanceReport({
    required DateTime startDate,
    required DateTime endDate,
  }) async {
    try {
      final response = await _dio.get(
        '/api/cash-advances/report',
        queryParameters: {
          'type': 'range',
          'startDate': startDate.toIso8601String(),
          'endDate': endDate.toIso8601String(),
        },
      );
      return response.data;
    } catch (e) {
      rethrow;
    }
  }

  Future<Map<String, dynamic>> reconcileCashAdvance({
    required String transactionId,
    required String billId,
    required double amount,
  }) async {
    try {
      final response = await _dio.post(
        '/api/cash-advances/reconcile/$transactionId',
        data: {
          'billId': billId,
          'amount': amount,
        },
      );
      return response.data;
    } catch (e) {
      rethrow;
    }
  }

  // Price Management endpoints (Admin)
  Future<Map<String, dynamic>> setDailyPrice({
    required String fuelType,
    required double pricePerLiter,
    String? date,
  }) async {
    try {
      final response = await _dio.post(
        '/api/admin/prices',
        data: {
          'fuelType': fuelType,
          'pricePerLiter': pricePerLiter,
          if (date != null) 'date': date,
        },
      );
      return response.data;
    } catch (e) {
      rethrow;
    }
  }

  Future<Map<String, dynamic>> updateDailyPrice({
    required String priceId,
    required double newPricePerLiter,
  }) async {
    try {
      final response = await _dio.put(
        '/api/admin/prices',
        data: {
          'priceId': priceId,
          'newPricePerLiter': newPricePerLiter,
        },
      );
      return response.data;
    } catch (e) {
      rethrow;
    }
  }

  Future<Map<String, dynamic>> getPriceUpdateStatus() async {
    try {
      final response = await _dio.get('/api/admin/prices');
      return response.data;
    } catch (e) {
      rethrow;
    }
  }

  Future<Map<String, dynamic>> getPriceHistoryByFuelType({
    required String fuelType,
    int days = 30,
  }) async {
    try {
      final response = await _dio.get(
        '/api/admin/prices/history/$fuelType',
        queryParameters: {'days': days},
      );
      return response.data;
    } catch (e) {
      rethrow;
    }
  }
}
