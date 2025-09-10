import 'package:flutter/foundation.dart';
import '../models/user.dart';
import '../services/auth_service.dart';

class AuthProvider with ChangeNotifier {
  final AuthService _authService = AuthService.instance;
  
  User? _user;
  bool _isLoading = false;
  bool _isAuthenticated = false;
  String? _error;

  User? get user => _user;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _isAuthenticated;
  String? get error => _error;

  Future<void> initialize() async {
    _setLoading(true);
    try {
      await _authService.initialize();
      _user = _authService.currentUser;
      _isAuthenticated = _authService.isAuthenticated;
      _clearError();
    } catch (e) {
      _setError('Failed to initialize authentication: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  Future<AuthResult> login(String email, String password, {bool rememberMe = false}) async {
    _setLoading(true);
    _clearError();
    
    try {
      final result = await _authService.login(email, password, rememberMe: rememberMe);
      
      if (result.isSuccess) {
        _user = result.user;
        _isAuthenticated = true;
        notifyListeners();
      } else {
        _setError(result.message);
      }
      
      return result;
    } catch (e) {
      final errorMessage = 'Login failed: ${e.toString()}';
      _setError(errorMessage);
      return AuthResult.failure(errorMessage);
    } finally {
      _setLoading(false);
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
    _setLoading(true);
    _clearError();
    
    try {
      final result = await _authService.register(
        name: name,
        email: email,
        password: password,
        confirmPassword: confirmPassword,
        role: role,
        phone: phone,
      );
      
      if (result.isSuccess) {
        _user = result.user;
        _isAuthenticated = true;
        notifyListeners();
      } else {
        _setError(result.message);
      }
      
      return result;
    } catch (e) {
      final errorMessage = 'Registration failed: ${e.toString()}';
      _setError(errorMessage);
      return AuthResult.failure(errorMessage);
    } finally {
      _setLoading(false);
    }
  }

  Future<AuthResult> loginWithGoogle() async {
    _setLoading(true);
    _clearError();
    
    try {
      final result = await _authService.loginWithGoogle();
      
      if (result.isSuccess) {
        _user = result.user;
        _isAuthenticated = true;
        notifyListeners();
      } else {
        _setError(result.message);
      }
      
      return result;
    } catch (e) {
      final errorMessage = 'Google sign-in failed: ${e.toString()}';
      _setError(errorMessage);
      return AuthResult.failure(errorMessage);
    } finally {
      _setLoading(false);
    }
  }

  Future<void> logout() async {
    _setLoading(true);
    
    try {
      await _authService.logout();
      _user = null;
      _isAuthenticated = false;
      _clearError();
      notifyListeners();
    } catch (e) {
      _setError('Logout failed: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> changePassword({
    required String currentPassword,
    required String newPassword,
    required String confirmPassword,
  }) async {
    _setLoading(true);
    _clearError();
    
    try {
      final success = await _authService.changePassword(
        currentPassword: currentPassword,
        newPassword: newPassword,
        confirmPassword: confirmPassword,
      );
      
      if (!success) {
        _setError('Failed to change password');
      }
      
      return success;
    } catch (e) {
      _setError('Password change failed: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
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
    _setLoading(true);
    _clearError();
    
    try {
      final success = await _authService.updateProfile(
        name: name,
        phone: phone,
        address: address,
        city: city,
        zipCode: zipCode,
        preferences: preferences,
      );
      
      if (success) {
        // Refresh user data
        await initialize();
      } else {
        _setError('Failed to update profile');
      }
      
      return success;
    } catch (e) {
      _setError('Profile update failed: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> verifyEmail(String token) async {
    _setLoading(true);
    _clearError();
    
    try {
      final success = await _authService.verifyEmail(token);
      
      if (success) {
        // Refresh user data
        await initialize();
      } else {
        _setError('Email verification failed');
      }
      
      return success;
    } catch (e) {
      _setError('Email verification failed: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> resendVerification() async {
    _setLoading(true);
    _clearError();
    
    try {
      final success = await _authService.resendVerification();
      
      if (!success) {
        _setError('Failed to resend verification email');
      }
      
      return success;
    } catch (e) {
      _setError('Failed to resend verification: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void _setError(String error) {
    _error = error;
    notifyListeners();
  }

  void _clearError() {
    _error = null;
    notifyListeners();
  }

  void clearError() {
    _clearError();
  }
}
