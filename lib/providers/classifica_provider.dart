import 'package:flutter/material.dart';
import '../services/supabase_service.dart';

class ClassificaProvider extends ChangeNotifier {
  List<Map<String, dynamic>> _classifica = [];
  bool _isLoading = false;
  String? _errorMessage;
  bool _hasLoaded = false;

  List<Map<String, dynamic>> get classifica => _classifica;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get hasLoaded => _hasLoaded;

  Future<void> loadClassifica({bool forceRefresh = false}) async {
    // Se i dati sono già stati caricati e non è un refresh forzato, non ricaricare
    if (_hasLoaded && !forceRefresh && _classifica.isNotEmpty) {
      return;
    }

    try {
      _isLoading = true;
      _errorMessage = null;
      // Notifica solo una volta all'inizio per mostrare il loading
      notifyListeners();

      // Carica tutti i dati in blocco
      final data = await SupabaseService.getClassifica();
      
      // Aggiorna tutto insieme per evitare rebuild multipli
      _classifica = data;
      _hasLoaded = true;
      _isLoading = false;
      
      // Notifica una sola volta alla fine con tutti i dati
      notifyListeners();
    } catch (e) {
      _errorMessage = 'Errore nel caricamento della classifica';
      _isLoading = false;
      notifyListeners();
    }
  }

  void refresh() {
    loadClassifica(forceRefresh: true);
  }

  // Metodo per precaricare i dati in background
  Future<void> preloadClassifica() async {
    if (!_hasLoaded && !_isLoading) {
      await loadClassifica();
    }
  }
}



