# Flutter Setup Guide for UrbanEye Mobile

This guide will help you set up the Flutter development environment and run the UrbanEye mobile app.

## Prerequisites

### 1. Install Flutter SDK

1. **Download Flutter**:
   - Go to [flutter.dev](https://flutter.dev/docs/get-started/install)
   - Download the latest stable release for Windows
   - Extract the zip file to `C:\flutter` (or your preferred location)

2. **Add Flutter to PATH**:
   - Open System Properties → Environment Variables
   - Add `C:\flutter\bin` to your PATH variable
   - Restart your command prompt/PowerShell

3. **Verify Installation**:
   ```bash
   flutter --version
   flutter doctor
   ```

### 2. Install Android Studio

1. **Download Android Studio**:
   - Go to [developer.android.com](https://developer.android.com/studio)
   - Download and install Android Studio

2. **Install Android SDK**:
   - Open Android Studio
   - Go to Tools → SDK Manager
   - Install Android SDK Platform 34 (Android 14)
   - Install Android SDK Build-Tools
   - Install Android SDK Command-line Tools

3. **Set up Android Emulator**:
   - Go to Tools → AVD Manager
   - Create a new Virtual Device
   - Choose a device (e.g., Pixel 6)
   - Download and select a system image (API 34 recommended)

### 3. Install VS Code (Recommended)

1. **Download VS Code**:
   - Go to [code.visualstudio.com](https://code.visualstudio.com/)
   - Download and install VS Code

2. **Install Flutter Extension**:
   - Open VS Code
   - Go to Extensions (Ctrl+Shift+X)
   - Search for "Flutter" and install it
   - This will also install the Dart extension

## Project Setup

### 1. Navigate to Project Directory

```bash
cd "C:\Users\kiran\OneDrive\Documents\MCA PROJECT\urbaneye_mobile"
```

### 2. Install Dependencies

```bash
flutter pub get
```

### 3. Verify Setup

```bash
flutter doctor
```

Make sure all items show green checkmarks. If there are issues, follow the suggested fixes.

## Running the App

### 1. Start Backend Server

First, make sure your Node.js backend is running:

```bash
cd "C:\Users\kiran\OneDrive\Documents\MCA PROJECT\server"
npm run dev
```

The backend should be running on `http://localhost:5000`

### 2. Start Android Emulator

- Open Android Studio
- Go to Tools → AVD Manager
- Click the play button next to your virtual device

### 3. Run Flutter App

```bash
flutter run
```

Or if you have multiple devices:

```bash
flutter devices
flutter run -d <device-id>
```

## Development Workflow

### Hot Reload
- Press `r` in the terminal to hot reload
- Press `R` to hot restart
- Press `q` to quit

### Debugging
- Use VS Code debugger
- Add breakpoints in your code
- Use `print()` statements for debugging
- Check Flutter Inspector for widget tree

### Building APK

For testing on physical devices:

```bash
flutter build apk --debug
```

The APK will be generated in `build/app/outputs/flutter-apk/`

## Common Issues and Solutions

### 1. Flutter Command Not Found
- Make sure Flutter is added to your PATH
- Restart your terminal/IDE
- Run `flutter doctor` to verify installation

### 2. Android SDK Not Found
- Install Android Studio and SDK
- Set ANDROID_HOME environment variable
- Run `flutter doctor --android-licenses`

### 3. Emulator Issues
- Make sure virtualization is enabled in BIOS
- Try creating a new AVD
- Use a physical device instead

### 4. Backend Connection Issues
- Verify backend is running on correct port
- Check firewall settings
- Use `http://10.0.2.2:5000` for Android emulator (maps to localhost)

### 5. Build Errors
- Run `flutter clean`
- Run `flutter pub get`
- Check for version conflicts in pubspec.yaml

## Project Structure Overview

```
urbaneye_mobile/
├── lib/
│   ├── main.dart              # App entry point
│   ├── models/                # Data models
│   ├── services/              # API services
│   ├── providers/             # State management
│   ├── screens/               # UI screens
│   ├── widgets/               # Reusable components
│   └── utils/                 # Utilities
├── assets/                    # Images, fonts, etc.
├── android/                   # Android-specific files
├── ios/                       # iOS-specific files
└── pubspec.yaml              # Dependencies
```

## Next Steps

1. **Explore the Code**: Start with `lib/main.dart` and follow the app flow
2. **Test Authentication**: Try registering and logging in
3. **Customize UI**: Modify colors, fonts, and layouts in `lib/utils/app_colors.dart`
4. **Add Features**: Implement complaint management features
5. **Test on Device**: Install on a physical device for better testing

## Useful Commands

```bash
# Check Flutter installation
flutter doctor

# Get dependencies
flutter pub get

# Run app
flutter run

# Build APK
flutter build apk

# Clean project
flutter clean

# Check for updates
flutter upgrade

# Analyze code
flutter analyze

# Format code
flutter format .
```

## Getting Help

- **Flutter Documentation**: [docs.flutter.dev](https://docs.flutter.dev/)
- **Dart Documentation**: [dart.dev](https://dart.dev/)
- **Stack Overflow**: Search for Flutter-related questions
- **Flutter Community**: [flutter.dev/community](https://flutter.dev/community)

## Backend Integration Notes

The mobile app is designed to work with your existing Node.js backend. Key integration points:

1. **Authentication**: Uses JWT tokens from your backend
2. **API Calls**: All API calls go to `http://localhost:5000/api`
3. **User Management**: Syncs with your User model
4. **Error Handling**: Handles backend error responses

Make sure your backend CORS settings allow requests from the mobile app.
