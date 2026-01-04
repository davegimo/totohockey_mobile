import 'package:flutter/material.dart';
import '../services/supabase_service.dart';
import '../models/models.dart';

class DashboardProvider extends ChangeNotifier {
  List<PartitaModel> _partite = [];
  TurnoModel? _turnoAttuale;
  bool _isLoading = false;
  String? _errorMessage;

  List<PartitaModel> get partite => _partite;
  TurnoModel? get turnoAttuale => _turnoAttuale;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  bool get isPronosticoScaduto {
    if (_turnoAttuale == null) return false;
    return _turnoAttuale!.isScaduto;
  }

  Duration get tempoRimanente {
    if (_turnoAttuale == null) return Duration.zero;
    return _turnoAttuale!.tempoRimanente;
  }

  RecapPunti get recapPunti {
    int puntiTotali = 0;
    int risultatiEsatti = 0;
    int esitiPresi = 0;

    for (var partita in _partite) {
      if (!partita.hasRisultato || partita.pronostico == null) continue;

      switch (partita.pronosticoResult) {
        case PronosticoResult.esatto:
          puntiTotali += 3;
          risultatiEsatti++;
          break;
        case PronosticoResult.corretto:
          puntiTotali += 1;
          esitiPresi++;
          break;
        default:
          break;
      }
    }

    return RecapPunti(
      puntiTotali: puntiTotali,
      risultatiEsatti: risultatiEsatti,
      esitiPresi: esitiPresi,
    );
  }

  Future<void> loadDashboard(String userId) async {
    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      // Carica ultimo turno
      _turnoAttuale = await SupabaseService.getUltimoTurno();

      if (_turnoAttuale == null) {
        _partite = [];
        _isLoading = false;
        notifyListeners();
        return;
      }

      // Carica partite con pronostici
      _partite = await SupabaseService.getPartiteConPronostici(
        userId: userId,
        turnoId: _turnoAttuale!.id,
      );

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = 'Errore nel caricamento dei dati';
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> salvaPronostico({
    required String userId,
    required String partitaId,
    required int pronosticoCasa,
    required int pronosticoOspite,
  }) async {
    try {
      await SupabaseService.savePronostico(
        userId: userId,
        partitaId: partitaId,
        pronosticoCasa: pronosticoCasa,
        pronosticoOspite: pronosticoOspite,
      );

      // Aggiorna localmente
      final index = _partite.indexWhere((p) => p.id == partitaId);
      if (index != -1) {
        _partite[index].pronostico = PronosticoModel(
          id: 'temp',
          userId: userId,
          partitaId: partitaId,
          pronosticoCasa: pronosticoCasa,
          pronosticoOspite: pronosticoOspite,
        );
        notifyListeners();
      }

      return true;
    } catch (e) {
      return false;
    }
  }

  void refresh(String userId) {
    loadDashboard(userId);
  }
}

class RecapPunti {
  final int puntiTotali;
  final int risultatiEsatti;
  final int esitiPresi;

  RecapPunti({
    required this.puntiTotali,
    required this.risultatiEsatti,
    required this.esitiPresi,
  });
}



