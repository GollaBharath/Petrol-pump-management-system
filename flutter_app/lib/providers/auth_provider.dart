import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:petrol_pump_management/models/models.dart';

class AuthNotifier extends StateNotifier<User?> {
  AuthNotifier() : super(null) {
    _initAuth();
  }

  Future<void> _initAuth() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access_token');
    final userJson = prefs.getString('user_data');

    if (token != null && userJson != null) {
      try {
        // In a real app, you'd verify the token is still valid
        state = User.fromJson(Map<String, dynamic>.from(userJson as Map));
      } catch (e) {
        state = null;
      }
    }
  }

  Future<void> setUser(User user) async {
    state = user;
    final prefs = await SharedPreferences.getInstance();
    // Store user data for offline access
  }

  Future<void> logout() async {
    state = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('access_token');
    await prefs.remove('user_data');
  }
}

final authNotifierProvider = StateNotifierProvider<AuthNotifier, User?>((ref) {
  return AuthNotifier();
});

// Auth state provider - returns current user or null
final authStateProvider = FutureProvider<User?>((ref) async {
  return ref.watch(authNotifierProvider);
});

// Check if user is logged in
final isLoggedInProvider = Provider<bool>((ref) {
  return ref.watch(authNotifierProvider) != null;
});

// Get current user role
final userRoleProvider = Provider<String?>((ref) {
  return ref.watch(authNotifierProvider)?.role;
});

// Check if user is customer
final isCustomerProvider = Provider<bool>((ref) {
  return ref.watch(userRoleProvider) == 'CUSTOMER';
});

// Check if user is employee
final isEmployeeProvider = Provider<bool>((ref) {
  return ref.watch(userRoleProvider) == 'EMPLOYEE';
});

// Check if user is admin
final isAdminProvider = Provider<bool>((ref) {
  return ref.watch(userRoleProvider) == 'ADMIN';
});
