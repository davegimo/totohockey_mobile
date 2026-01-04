import 'package:flutter/material.dart';
import 'login_screen.dart';
import 'signup_screen.dart';
import 'forgot_password_screen.dart';

enum AuthPage { login, signup, forgotPassword }

class AuthWrapper extends StatefulWidget {
  const AuthWrapper({super.key});

  @override
  State<AuthWrapper> createState() => _AuthWrapperState();
}

class _AuthWrapperState extends State<AuthWrapper> {
  AuthPage _currentPage = AuthPage.login;

  void _navigateTo(AuthPage page) {
    setState(() {
      _currentPage = page;
    });
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 300),
      child: _buildCurrentPage(),
    );
  }

  Widget _buildCurrentPage() {
    switch (_currentPage) {
      case AuthPage.login:
        return LoginScreen(
          key: const ValueKey('login'),
          onSignUpTap: () => _navigateTo(AuthPage.signup),
          onForgotPasswordTap: () => _navigateTo(AuthPage.forgotPassword),
        );
      case AuthPage.signup:
        return SignupScreen(
          key: const ValueKey('signup'),
          onLoginTap: () => _navigateTo(AuthPage.login),
          onSuccess: () => _navigateTo(AuthPage.login),
        );
      case AuthPage.forgotPassword:
        return ForgotPasswordScreen(
          key: const ValueKey('forgotPassword'),
          onBackTap: () => _navigateTo(AuthPage.login),
        );
    }
  }
}



