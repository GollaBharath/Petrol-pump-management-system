import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:petrol_pump_management/config/app_config.dart';
import 'package:petrol_pump_management/models/models.dart';

class ApiException implements Exception {
  final String message;
  final int? statusCode;
  final dynamic details;

  ApiException(this.message, {this.statusCode, this.details});

  @override
  String toString() => message;
}

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

  // Helper method to handle API errors
  ApiException _handleError(DioException error) {
    if (error.response != null) {
      final data = error.response!.data;
      final message = data is Map<String, dynamic> && data.containsKey('error')
          ? data['error']
          : 'An error occurred';
      return ApiException(
        message,
        statusCode: error.response!.statusCode,
        details: data,
      );
    } else if (error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.receiveTimeout) {
      return ApiException('Connection timeout. Please try again.');
    } else if (error.type == DioExceptionType.connectionError) {
      return ApiException('No internet connection. Please check your network.');
    } else {
      return ApiException('An unexpected error occurred: ${error.message}');
    }
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
        '/auth/signup',
        data: {
          'email': email,
          'password': password,
          'fullName': fullName,
          'phone': phone,
          'role': role,
        },
      );
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _dio.post(
        '/auth/login',
        data: {'email': email, 'password': password},
      );

      final data = response.data as Map<String, dynamic>;
      if (data.containsKey('session')) {
        final session = data['session'] as Map<String, dynamic>;
        if (session.containsKey('accessToken')) {
          await _secureStorage.write(
            key: AppConfig.accessTokenKey,
            value: session['accessToken'] as String,
          );
        }
        if (session.containsKey('refreshToken')) {
          await _secureStorage.write(
            key: AppConfig.refreshTokenKey,
            value: session['refreshToken'] as String,
          );
        }
      }

      return data;
    } on DioException catch (e) {
      throw _handleError(e);
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
        '/orders',
        data: {
          'vehicleNumber': vehicleNumber,
          'fuelType': fuelType,
          if (amountRequested != null) 'amountRequested': amountRequested,
          if (quantityRequested != null) 'quantityRequested': quantityRequested,
          'cashAdvance': cashAdvance,
        },
      );
      final data = response.data as Map<String, dynamic>;
      return Order.fromJson(data['order'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<List<Order>> getOrders({int limit = 20, int offset = 0}) async {
    try {
      final response = await _dio.get(
        '/orders',
        queryParameters: {'limit': limit, 'offset': offset},
      );
      final data = response.data as Map<String, dynamic>;
      final orders = (data['orders'] as List)
          .map((order) => Order.fromJson(order as Map<String, dynamic>))
          .toList();
      return orders;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<List<Order>> getPendingOrders() async {
    try {
      final response = await _dio.get('/orders/pending');
      final data = response.data as Map<String, dynamic>;
      final orders = (data['orders'] as List)
          .map((order) => Order.fromJson(order as Map<String, dynamic>))
          .toList();
      return orders;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Order> getOrderDetails(String orderId) async {
    try {
      final response = await _dio.get('/orders/$orderId');
      final data = response.data as Map<String, dynamic>;
      return Order.fromJson(data['order'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Order> markOrderDelivered(
    String orderId,
    double quantityDelivered,
  ) async {
    try {
      final response = await _dio.patch(
        '/orders/$orderId',
        data: {'quantityDelivered': quantityDelivered},
      );
      final data = response.data as Map<String, dynamic>;
      return Order.fromJson(data['order'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // Price endpoints
  Future<List<FuelPrice>> getLatestPrices() async {
    try {
      final response = await _dio.get('/prices');
      final data = response.data as Map<String, dynamic>;
      final prices = (data['prices'] as List)
          .map((price) => FuelPrice.fromJson(price as Map<String, dynamic>))
          .toList();
      return prices;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<List<FuelPrice>> getPriceHistory({
    String? fuelType,
    int limit = 30,
    int offset = 0,
  }) async {
    try {
      final response = await _dio.get(
        '/prices/history',
        queryParameters: {
          if (fuelType != null) 'fuelType': fuelType,
          'limit': limit,
          'offset': offset,
        },
      );
      final data = response.data as Map<String, dynamic>;
      final prices = (data['prices'] as List)
          .map((price) => FuelPrice.fromJson(price as Map<String, dynamic>))
          .toList();
      return prices;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // Bill endpoints
  Future<Bill> getBillDetails(String billId) async {
    try {
      final response = await _dio.get('/bills/$billId');
      final data = response.data as Map<String, dynamic>;
      return Bill.fromJson(data['bill'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<List<Bill>> getBills({int limit = 20, int offset = 0}) async {
    try {
      final response = await _dio.get(
        '/bills',
        queryParameters: {'limit': limit, 'offset': offset},
      );
      final data = response.data as Map<String, dynamic>;
      final bills = (data['bills'] as List)
          .map((bill) => Bill.fromJson(bill as Map<String, dynamic>))
          .toList();
      return bills;
    } on DioException catch (e) {
      throw _handleError(e);
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
        '/cash-advances',
        data: {
          'orderId': orderId,
          'employeeId': employeeId,
          'amount': amount,
          if (description != null) 'description': description,
        },
      );
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Map<String, dynamic>> getEmployeeCashAdvanceSummary(
    String employeeId,
  ) async {
    try {
      final response = await _dio.get(
        '/cash-advances/$employeeId',
      );
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Map<String, dynamic>> getPendingCashAdvances() async {
    try {
      final response = await _dio.get(
        '/cash-advances/report',
        queryParameters: {'type': 'pending'},
      );
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Map<String, dynamic>> getCashAdvanceReport({
    required DateTime startDate,
    required DateTime endDate,
  }) async {
    try {
      final response = await _dio.get(
        '/cash-advances/report',
        queryParameters: {
          'type': 'range',
          'startDate': startDate.toIso8601String(),
          'endDate': endDate.toIso8601String(),
        },
      );
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Map<String, dynamic>> reconcileCashAdvance({
    required String transactionId,
    required String billId,
    required double amount,
  }) async {
    try {
      final response = await _dio.post(
        '/cash-advances/reconcile/$transactionId',
        data: {
          'billId': billId,
          'amount': amount,
        },
      );
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _handleError(e);
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
        '/admin/prices',
        data: {
          'fuelType': fuelType,
          'pricePerLiter': pricePerLiter,
          if (date != null) 'date': date,
        },
      );
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Map<String, dynamic>> updateDailyPrice({
    required String priceId,
    required double newPricePerLiter,
  }) async {
    try {
      final response = await _dio.put(
        '/admin/prices',
        data: {
          'priceId': priceId,
          'newPricePerLiter': newPricePerLiter,
        },
      );
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Map<String, dynamic>> getPriceUpdateStatus() async {
    try {
      final response = await _dio.get('/admin/prices');
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Map<String, dynamic>> getPriceHistoryByFuelType({
    required String fuelType,
    int days = 30,
  }) async {
    try {
      final response = await _dio.get(
        '/admin/prices/history/$fuelType',
        queryParameters: {'days': days},
      );
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }
}
