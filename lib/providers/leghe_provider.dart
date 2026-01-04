import 'package:flutter/material.dart';
import '../services/supabase_service.dart';
import '../models/models.dart';

class LegheProvider extends ChangeNotifier {
  List<LegaModel> _leghe = [];
  LegaModel? _legaSelezionata;
  List<ClassificaLegaModel> _classificaLega = [];
  bool _isLoading = false;
  bool _isAdmin = false;
  String? _errorMessage;

  List<LegaModel> get leghe => _leghe;
  LegaModel? get legaSelezionata => _legaSelezionata;
  List<ClassificaLegaModel> get classificaLega => _classificaLega;
  bool get isLoading => _isLoading;
  bool get isAdmin => _isAdmin;
  String? get errorMessage => _errorMessage;

  Future<void> loadLegheUtente() async {
    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      _leghe = await SupabaseService.getLegheUtente();

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = 'Errore nel caricamento delle leghe';
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadLega(String legaId) async {
    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      _legaSelezionata = await SupabaseService.getLegaById(legaId);
      _classificaLega = await SupabaseService.getClassificaLega(legaId);
      _isAdmin = await SupabaseService.isLegaAdmin(legaId);

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = 'Errore nel caricamento della lega';
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<LegaModel?> creaLega({
    required String nome,
    String? descrizione,
    bool isPubblica = false,
  }) async {
    try {
      _isLoading = true;
      notifyListeners();

      final lega = await SupabaseService.creaLega(
        nome: nome,
        descrizione: descrizione,
        isPubblica: isPubblica,
      );

      _leghe.add(lega);
      _isLoading = false;
      notifyListeners();

      return lega;
    } catch (e) {
      _errorMessage = 'Errore nella creazione della lega';
      _isLoading = false;
      notifyListeners();
      return null;
    }
  }

  Future<Map<String, dynamic>?> partecipaConCodice(String codice) async {
    try {
      _isLoading = true;
      notifyListeners();

      final result = await SupabaseService.partecipaLegaConCodice(codice);
      
      if (result['success'] == true) {
        await loadLegheUtente();
      }

      _isLoading = false;
      notifyListeners();

      return result;
    } catch (e) {
      _errorMessage = 'Errore nella partecipazione alla lega';
      _isLoading = false;
      notifyListeners();
      return null;
    }
  }

  Future<String?> rigeneraLink() async {
    if (_legaSelezionata == null) return null;

    try {
      final nuovoCodice = await SupabaseService.rigeneraLinkInvito(_legaSelezionata!.id);
      
      if (nuovoCodice != null) {
        await loadLega(_legaSelezionata!.id);
      }

      return nuovoCodice;
    } catch (e) {
      _errorMessage = 'Errore nella rigenerazione del link';
      notifyListeners();
      return null;
    }
  }

  void refresh() {
    loadLegheUtente();
  }

  void clearLegaSelezionata() {
    _legaSelezionata = null;
    _classificaLega = [];
    _isAdmin = false;
    notifyListeners();
  }
}



