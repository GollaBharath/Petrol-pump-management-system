import 'package:flutter/material.dart';

class AppConfig {
  // API Configuration
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://192.168.0.7:3000/api',
  );

  // Supabase Configuration
  static const String supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'https://your-project.supabase.co',
  );

  static const String supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: '',
  );

  // UI Configuration
  static const primaryColor = Color(0xFF2563EB); // Blue
  static const secondaryColor = Color(0xFF10B981); // Green
  static const errorColor = Color(0xFFEF4444); // Red
  static const warningColor = Color(0xFFF59E0B); // Amber
  static const successColor = Color(0xFF10B981); // Green
  static const backgroundColor = Color(0xFFF9FAFB); // Light Gray

  // Timeout Configuration
  static const Duration apiTimeout = Duration(seconds: 30);
  static const Duration connectTimeout = Duration(seconds: 10);

  // Storage Keys
  static const String accessTokenKey = 'access_token';
  static const String refreshTokenKey = 'refresh_token';
  static const String userIdKey = 'user_id';
  static const String userRoleKey = 'user_role';
  static const String userEmailKey = 'user_email';
}
