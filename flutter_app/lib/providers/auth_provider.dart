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
    final userId = prefs.getString('user_id');
    final userEmail = prefs.getString('user_email');
    final userRole = prefs.getString('user_role');
    final userFullName = prefs.getString('user_full_name');

    if (token != null && userId != null) {
      // Reconstruct user from stored data
      state = User(
        id: userId,
        email: userEmail ?? '',
        fullName: userFullName ?? '',
        role: userRole ?? 'CUSTOMER',
        createdAt: DateTime.now(), // Placeholder
      );
    }
  }

  Future<void> setUser(User user) async {
    state = user;
    final prefs = await SharedPreferences.getInstance();
    // Store user data for offline access
    await prefs.setString('user_id', user.id);
    await prefs.setString('user_email', user.email);
    await prefs.setString('user_role', user.role);
    await prefs.setString('user_full_name', user.fullName);
  }

  Future<void> logout() async {
    state = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('access_token');
    await prefs.remove('refresh_token');
    await prefs.remove('user_id');
    await prefs.remove('user_email');
    await prefs.remove('user_role');
    await prefs.remove('user_full_name');
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
