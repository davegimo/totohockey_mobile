import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../services/supabase_service.dart';
import '../models/models.dart';

enum AuthStatus {
  initial,
  authenticated,
  unauthenticated,
  loading,
}

class AuthProvider extends ChangeNotifier {
  AuthStatus _status = AuthStatus.initial;
  UserModel? _user;
  String? _errorMessage;
  bool _isAdmin = false;
  bool _hasChecked = false;

  AuthStatus get status => _status;
  UserModel? get user => _user;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _status == AuthStatus.authenticated;
  bool get isAdmin => _isAdmin;

  AuthProvider() {
    _initAuth();
    // Fallback: dopo 3 secondi, se non abbiamo ancora controllato, forza unauthenticated
    Future.delayed(const Duration(seconds: 3), () {
      if (!_hasChecked && _status == AuthStatus.initial) {
        debugPrint('AuthProvider: Timeout - forzo unauthenticated');
        _status = AuthStatus.unauthenticated;
        notifyListeners();
      }
    });
  }

  void _initAuth() {
    debugPrint('AuthProvider: Inizializzazione...');
    
    // Ascolta i cambiamenti di stato dell'autenticazione
    SupabaseService.authStateChanges.listen((data) async {
      debugPrint('AuthProvider: Cambio stato autenticazione - session: ${data.session != null}');
      final session = data.session;
      if (session != null) {
        await _loadUserProfile();
        _status = AuthStatus.authenticated;
        debugPrint('AuthProvider: Utente autenticato');
      } else {
        _user = null;
        _isAdmin = false;
        _status = AuthStatus.unauthenticated;
        debugPrint('AuthProvider: Utente non autenticato');
      }
      notifyListeners();
    });

    // Verifica sessione corrente con timeout
    _checkCurrentSession();
  }

  Future<void> _checkCurrentSession() async {
    try {
      debugPrint('AuthProvider: Verifica sessione corrente...');
      final user = SupabaseService.currentUser;
      debugPrint('AuthProvider: Utente corrente: ${user?.id ?? "null"}');
      
      if (user != null) {
        await _loadUserProfile();
        _status = AuthStatus.authenticated;
        debugPrint('AuthProvider: Sessione trovata, utente autenticato');
      } else {
        _status = AuthStatus.unauthenticated;
        debugPrint('AuthProvider: Nessuna sessione, utente non autenticato');
      }
    } catch (e, stackTrace) {
      debugPrint('AuthProvider: Errore verifica sessione: $e');
      debugPrint('AuthProvider: Stack trace: $stackTrace');
      _status = AuthStatus.unauthenticated;
    } finally {
      _hasChecked = true;
      notifyListeners();
    }
  }

  Future<void> _loadUserProfile() async {
    try {
      _user = await SupabaseService.getCurrentUserProfile();
      _isAdmin = await SupabaseService.isAdmin();
    } catch (e) {
      debugPrint('Errore caricamento profilo: $e');
    }
  }

  Future<bool> signUp({
    required String email,
    required String password,
    required String nome,
    required String cognome,
  }) async {
    try {
      _status = AuthStatus.loading;
      _errorMessage = null;
      notifyListeners();

      await SupabaseService.signUp(
        email: email,
        password: password,
        nome: nome,
        cognome: cognome,
      );

      _status = AuthStatus.unauthenticated;
      notifyListeners();
      return true;
    } on AuthException catch (e) {
      _errorMessage = _getErrorMessage(e.message);
      _status = AuthStatus.unauthenticated;
      notifyListeners();
      return false;
    } catch (e) {
      _errorMessage = 'Si è verificato un errore. Riprova più tardi.';
      _status = AuthStatus.unauthenticated;
      notifyListeners();
      return false;
    }
  }

  Future<bool> signIn({
    required String email,
    required String password,
  }) async {
    try {
      _status = AuthStatus.loading;
      _errorMessage = null;
      notifyListeners();

      await SupabaseService.signIn(
        email: email,
        password: password,
      );

      await _loadUserProfile();
      _status = AuthStatus.authenticated;
      notifyListeners();
      return true;
    } on AuthException catch (e) {
      _errorMessage = _getErrorMessage(e.message);
      _status = AuthStatus.unauthenticated;
      notifyListeners();
      return false;
    } catch (e) {
      _errorMessage = 'Si è verificato un errore. Riprova più tardi.';
      _status = AuthStatus.unauthenticated;
      notifyListeners();
      return false;
    }
  }

  Future<void> signOut() async {
    try {
      await SupabaseService.signOut();
      _user = null;
      _isAdmin = false;
      _status = AuthStatus.unauthenticated;
      notifyListeners();
    } catch (e) {
      debugPrint('Errore logout: $e');
    }
  }

  Future<bool> resetPassword(String email) async {
    try {
      _errorMessage = null;
      await SupabaseService.resetPassword(email);
      return true;
    } catch (e) {
      _errorMessage = 'Si è verificato un errore. Riprova più tardi.';
      return false;
    }
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }

  String _getErrorMessage(String message) {
    if (message.contains('Invalid login credentials')) {
      return 'Credenziali non valide. Controlla email e password.';
    }
    if (message.contains('Email not confirmed')) {
      return 'Email non confermata. Controlla la tua casella email.';
    }
    if (message.contains('User already registered')) {
      return 'Questa email è già registrata.';
    }
    if (message.contains('Password should be at least')) {
      return 'La password deve avere almeno 6 caratteri.';
    }
    return message;
  }
}



