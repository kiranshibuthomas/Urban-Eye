import 'package:google_sign_in/google_sign_in.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user.dart';
import '../models/auth_response.dart';
import 'api_service.dart';

class AuthService {
  static AuthService? _instance;
  static AuthService get instance => _instance ??= AuthService._();
  
  AuthService._();

  final ApiService _apiService = ApiService.instance;
  final GoogleSignIn _googleSignIn = GoogleSignIn(
    // Remove clientId for Android - it's not needed and causes issues
    // clientId: '309086212652-8m1kf7l6jt543j97kg0rrnrkptgfdg81.apps.googleusercontent.com',
  );

  User? _currentUser;
  bool _isAuthenticated = false;

  User? get currentUser => _currentUser;
  bool get isAuthenticated => _isAuthenticated;

  Future<void> initialize() async {
    final token = await _apiService.token;
    if (token != null) {
      try {
        final response = await _apiService.getCurrentUser();
        if (response.success && response.data != null) {
          _currentUser = response.data;
          _isAuthenticated = true;
        } else {
          await logout();
        }
      } catch (e) {
        await logout();
      }
    }
  }

  Future<AuthResult> login(String email, String password, {bool rememberMe = false}) async {
    try {
      final response = await _apiService.login(email, password, rememberMe: rememberMe);
      
      if (response.success && response.data != null) {
        _currentUser = response.data!.user;
        _isAuthenticated = true;
        
        // Save user data locally
        final prefs = await SharedPreferences.getInstance();
        if (_currentUser != null) {
          await prefs.setString('user_data', _currentUser!.toJson().toString());
        }
        
        return AuthResult.success(
          user: _currentUser!,
          message: response.data!.message,
          requiresEmailVerification: response.data!.requiresEmailVerification ?? false,
        );
      } else {
        return AuthResult.failure(response.message);
      }
    } catch (e) {
      return AuthResult.failure('Login failed: ${e.toString()}');
    }
  }

  Future<AuthResult> register({
    required String name,
    required String email,
    required String password,
    required String confirmPassword,
    String role = 'citizen',
    String? phone,
  }) async {
    try {
      final response = await _apiService.register(
        name: name,
        email: email,
        password: password,
        confirmPassword: confirmPassword,
        role: role,
        phone: phone,
      );
      
      if (response.success && response.data != null) {
        _currentUser = response.data!.user;
        _isAuthenticated = true;
        
        // Save user data locally
        final prefs = await SharedPreferences.getInstance();
        if (_currentUser != null) {
          await prefs.setString('user_data', _currentUser!.toJson().toString());
        }
        
        return AuthResult.success(
          user: _currentUser!,
          message: response.data!.message,
          requiresEmailVerification: response.data!.requiresEmailVerification ?? false,
        );
      } else {
        return AuthResult.failure(response.message);
      }
    } catch (e) {
      return AuthResult.failure('Registration failed: ${e.toString()}');
    }
  }

  Future<AuthResult> loginWithGoogle() async {
    try {
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      
      if (googleUser == null) {
        return AuthResult.failure('Google sign-in was cancelled');
      }

      final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
      
      if (googleAuth.accessToken == null) {
        return AuthResult.failure('Failed to get Google access token');
      }

      // For now, create a mock user since we don't have a real Google OAuth setup
      // In production, you would send the token to your backend for verification
      final mockUser = User(
        id: 'google_${googleUser.id}',
        name: googleUser.displayName ?? 'Google User',
        email: googleUser.email,
        role: 'citizen',
        googleId: googleUser.id,
        avatar: googleUser.photoUrl,
        isEmailVerified: true,
        phone: null,
        address: null,
        city: null,
        zipCode: null,
        preferences: UserPreferences(
          emailNotifications: true,
          smsNotifications: false,
          pushNotifications: true,
        ),
        lastLogin: DateTime.now(),
        isActive: true,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      _currentUser = mockUser;
      _isAuthenticated = true;
      
      // Save user data locally
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('user_data', mockUser.toJson().toString());
      
      return AuthResult.success(
        user: mockUser,
        message: 'Google login successful',
        requiresEmailVerification: false,
      );
    } catch (e) {
      return AuthResult.failure('Google sign-in failed: ${e.toString()}');
    }
  }

  Future<void> logout() async {
    try {
      await _apiService.logout();
    } catch (e) {
      // Continue with logout even if API call fails
    }
    
    await _googleSignIn.signOut();
    
    _currentUser = null;
    _isAuthenticated = false;
    
    // Clear local storage
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('user_data');
  }

  Future<bool> changePassword({
    required String currentPassword,
    required String newPassword,
    required String confirmPassword,
  }) async {
    try {
      final response = await _apiService.changePassword(
        currentPassword: currentPassword,
        newPassword: newPassword,
        confirmPassword: confirmPassword,
      );
      
      return response.success;
    } catch (e) {
      return false;
    }
  }

  Future<bool> updateProfile({
    String? name,
    String? phone,
    String? address,
    String? city,
    String? zipCode,
    Map<String, bool>? preferences,
  }) async {
    try {
      final response = await _apiService.updateProfile(
        name: name,
        phone: phone,
        address: address,
        city: city,
        zipCode: zipCode,
        preferences: preferences,
      );
      
      if (response.success && response.data != null) {
        _currentUser = response.data;
        
        // Update local storage
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('user_data', _currentUser!.toJson().toString());
        
        return true;
      }
      
      return false;
    } catch (e) {
      return false;
    }
  }

  Future<bool> verifyEmail(String token) async {
    try {
      final response = await _apiService.verifyEmail(token);
      return response.success;
    } catch (e) {
      return false;
    }
  }

  Future<bool> resendVerification() async {
    try {
      final response = await _apiService.resendVerification();
      return response.success;
    } catch (e) {
      return false;
    }
  }

  Future<bool> testConnection() async {
    try {
      final response = await _apiService.testConnection();
      return response.success;
    } catch (e) {
      return false;
    }
  }
}

class AuthResult {
  final bool isSuccess;
  final User? user;
  final String message;
  final bool requiresEmailVerification;

  AuthResult._({
    required this.isSuccess,
    this.user,
    required this.message,
    this.requiresEmailVerification = false,
  });

  factory AuthResult.success({
    required User user,
    required String message,
    bool requiresEmailVerification = false,
  }) {
    return AuthResult._(
      isSuccess: true,
      user: user,
      message: message,
      requiresEmailVerification: requiresEmailVerification,
    );
  }

  factory AuthResult.failure(String message) {
    return AuthResult._(
      isSuccess: false,
      message: message,
    );
  }
}
