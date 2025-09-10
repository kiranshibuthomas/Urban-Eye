class User {
  final String id;
  final String name;
  final String email;
  final String role;
  final String? googleId;
  final String? avatar;
  final bool isEmailVerified;
  final String? phone;
  final String? address;
  final String? city;
  final String? zipCode;
  final UserPreferences preferences;
  final DateTime lastLogin;
  final bool isActive;
  final DateTime createdAt;
  final DateTime updatedAt;

  User({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.googleId,
    this.avatar,
    required this.isEmailVerified,
    this.phone,
    this.address,
    this.city,
    this.zipCode,
    required this.preferences,
    required this.lastLogin,
    required this.isActive,
    required this.createdAt,
    required this.updatedAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['_id'] ?? json['id'],
      name: json['name'],
      email: json['email'],
      role: json['role'],
      googleId: json['googleId'],
      avatar: json['avatar'],
      isEmailVerified: json['isEmailVerified'] ?? false,
      phone: json['phone'],
      address: json['address'],
      city: json['city'],
      zipCode: json['zipCode'],
      preferences: UserPreferences.fromJson(json['preferences'] ?? {}),
      lastLogin: DateTime.parse(json['lastLogin']),
      isActive: json['isActive'] ?? true,
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'role': role,
      'googleId': googleId,
      'avatar': avatar,
      'isEmailVerified': isEmailVerified,
      'phone': phone,
      'address': address,
      'city': city,
      'zipCode': zipCode,
      'preferences': preferences.toJson(),
      'lastLogin': lastLogin.toIso8601String(),
      'isActive': isActive,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  User copyWith({
    String? id,
    String? name,
    String? email,
    String? role,
    String? googleId,
    String? avatar,
    bool? isEmailVerified,
    String? phone,
    String? address,
    String? city,
    String? zipCode,
    UserPreferences? preferences,
    DateTime? lastLogin,
    bool? isActive,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return User(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      role: role ?? this.role,
      googleId: googleId ?? this.googleId,
      avatar: avatar ?? this.avatar,
      isEmailVerified: isEmailVerified ?? this.isEmailVerified,
      phone: phone ?? this.phone,
      address: address ?? this.address,
      city: city ?? this.city,
      zipCode: zipCode ?? this.zipCode,
      preferences: preferences ?? this.preferences,
      lastLogin: lastLogin ?? this.lastLogin,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

class UserPreferences {
  final bool emailNotifications;
  final bool smsNotifications;
  final bool pushNotifications;

  UserPreferences({
    required this.emailNotifications,
    required this.smsNotifications,
    required this.pushNotifications,
  });

  factory UserPreferences.fromJson(Map<String, dynamic> json) {
    return UserPreferences(
      emailNotifications: json['emailNotifications'] ?? true,
      smsNotifications: json['smsNotifications'] ?? false,
      pushNotifications: json['pushNotifications'] ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'emailNotifications': emailNotifications,
      'smsNotifications': smsNotifications,
      'pushNotifications': pushNotifications,
    };
  }

  UserPreferences copyWith({
    bool? emailNotifications,
    bool? smsNotifications,
    bool? pushNotifications,
  }) {
    return UserPreferences(
      emailNotifications: emailNotifications ?? this.emailNotifications,
      smsNotifications: smsNotifications ?? this.smsNotifications,
      pushNotifications: pushNotifications ?? this.pushNotifications,
    );
  }
}
