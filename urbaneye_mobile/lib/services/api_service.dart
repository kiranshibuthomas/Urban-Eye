import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/api_response.dart';
import '../models/auth_response.dart';
import '../models/user.dart';

class ApiService {
  static const String baseUrl = 'http://192.168.57.148:5000/api';
  static const String authUrl = '$baseUrl/auth';
  
  static ApiService? _instance;
  static ApiService get instance => _instance ??= ApiService._();
  
  ApiService._();

  String? _token;
  
  Future<String?> get token async {
    if (_token != null) return _token;
    
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('auth_token');
    return _token;
  }

  Future<void> setToken(String token) async {
    _token = token;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', token);
  }

  Future<void> clearToken() async {
    _token = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
  }

  Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  Map<String, String> get _authHeaders => {
    ..._headers,
    if (_token != null) 'Authorization': 'Bearer $_token',
  };

  Future<http.Response> _makeRequest(
    String method,
    String url, {
    Map<String, dynamic>? body,
    bool requiresAuth = false,
  }) async {
    final uri = Uri.parse(url);
    final headers = requiresAuth ? _authHeaders : _headers;
    
    // Debug logging
    print('🌐 API Request: $method $url');
    print('📤 Headers: $headers');
    if (body != null) {
      print('📦 Body: ${json.encode(body)}');
    }
    
    http.Response response;
    
    try {
      switch (method.toUpperCase()) {
        case 'GET':
          response = await http.get(uri, headers: headers);
          break;
        case 'POST':
          response = await http.post(
            uri,
            headers: headers,
            body: body != null ? json.encode(body) : null,
          );
          break;
        case 'PUT':
          response = await http.put(
            uri,
            headers: headers,
            body: body != null ? json.encode(body) : null,
          );
          break;
        case 'DELETE':
          response = await http.delete(uri, headers: headers);
          break;
        default:
          throw Exception('Unsupported HTTP method: $method');
      }
      
      // Debug logging
      print('📥 Response Status: ${response.statusCode}');
      print('📥 Response Body: ${response.body}');
      
    } catch (e) {
      print('❌ API Request Error: $e');
      rethrow;
    }

    return response;
  }

  Future<ApiResponse<T>> _handleResponse<T>(
    http.Response response,
    T Function(dynamic)? fromJson,
  ) async {
    try {
      final data = json.decode(response.body);
      
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return ApiResponse<T>(
          success: data['success'] ?? true,
          message: data['message'] ?? 'Success',
          data: fromJson != null ? fromJson(data) : data,
        );
      } else {
        return ApiResponse<T>(
          success: false,
          message: data['message'] ?? 'Request failed',
          error: data['error'] ?? 'Unknown error',
        );
      }
    } catch (e) {
      return ApiResponse<T>(
        success: false,
        message: 'Failed to parse response',
        error: e.toString(),
      );
    }
  }

  // Auth endpoints
  Future<ApiResponse<AuthResponse>> login(String email, String password, {bool rememberMe = false}) async {
    final response = await _makeRequest(
      'POST',
      '$authUrl/login',
      body: {
        'email': email,
        'password': password,
        'rememberMe': rememberMe,
      },
    );

    final result = await _handleResponse<AuthResponse>(
      response,
      (data) => AuthResponse.fromJson(data),
    );

    if (result.success && result.data?.token != null) {
      await setToken(result.data!.token!);
    }

    return result;
  }

  Future<ApiResponse<AuthResponse>> register({
    required String name,
    required String email,
    required String password,
    required String confirmPassword,
    String role = 'citizen',
    String? phone,
  }) async {
    final response = await _makeRequest(
      'POST',
      '$authUrl/register',
      body: {
        'name': name,
        'email': email,
        'password': password,
        'confirmPassword': confirmPassword,
        'role': role,
        'phone': phone,
      },
    );

    final result = await _handleResponse<AuthResponse>(
      response,
      (data) => AuthResponse.fromJson(data),
    );

    if (result.success && result.data?.token != null) {
      await setToken(result.data!.token!);
    }

    return result;
  }

  Future<ApiResponse<dynamic>> logout() async {
    final response = await _makeRequest(
      'POST',
      '$authUrl/logout',
      requiresAuth: true,
    );

    await clearToken();
    
    return await _handleResponse(response, null);
  }

  Future<ApiResponse<User>> getCurrentUser() async {
    final response = await _makeRequest(
      'GET',
      '$authUrl/me',
      requiresAuth: true,
    );

    return await _handleResponse<User>(
      response,
      (data) => User.fromJson(data['user'] ?? data),
    );
  }

  Future<ApiResponse<User>> updateProfile({
    String? name,
    String? phone,
    String? address,
    String? city,
    String? zipCode,
    Map<String, bool>? preferences,
  }) async {
    final body = <String, dynamic>{};
    
    if (name != null) body['name'] = name;
    if (phone != null) body['phone'] = phone;
    if (address != null) body['address'] = address;
    if (city != null) body['city'] = city;
    if (zipCode != null) body['zipCode'] = zipCode;
    if (preferences != null) body['preferences'] = preferences;

    final response = await _makeRequest(
      'PUT',
      '$authUrl/profile',
      body: body,
      requiresAuth: true,
    );

    return await _handleResponse<User>(
      response,
      (data) => User.fromJson(data['user'] ?? data),
    );
  }

  Future<ApiResponse<dynamic>> changePassword({
    required String currentPassword,
    required String newPassword,
    required String confirmPassword,
  }) async {
    final response = await _makeRequest(
      'PUT',
      '$authUrl/change-password',
      body: {
        'currentPassword': currentPassword,
        'newPassword': newPassword,
        'confirmPassword': confirmPassword,
      },
      requiresAuth: true,
    );

    return await _handleResponse(response, null);
  }

  Future<ApiResponse<dynamic>> verifyEmail(String token) async {
    final response = await _makeRequest(
      'GET',
      '$authUrl/verify-email/$token',
    );

    return await _handleResponse(response, null);
  }

  Future<ApiResponse<dynamic>> resendVerification() async {
    final response = await _makeRequest(
      'POST',
      '$authUrl/resend-verification',
      requiresAuth: true,
    );

    return await _handleResponse(response, null);
  }

  // Google OAuth endpoint
  Future<ApiResponse<AuthResponse>> loginWithGoogle(String googleToken) async {
    final response = await _makeRequest(
      'POST',
      '$authUrl/google',
      body: {
        'googleToken': googleToken,
      },
    );

    final result = await _handleResponse<AuthResponse>(
      response,
      (data) => AuthResponse.fromJson(data),
    );

    if (result.success && result.data?.token != null) {
      await setToken(result.data!.token!);
    }

    return result;
  }

  // Test endpoint
  Future<ApiResponse<dynamic>> testConnection() async {
    final response = await _makeRequest('GET', '$baseUrl/test');
    return await _handleResponse(response, null);
  }
}
