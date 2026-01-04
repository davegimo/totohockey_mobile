import 'squadra_model.dart';
import 'pronostico_model.dart';

class PartitaModel {
  final String id;
  final String turnoId;
  final int squadraCasaId;
  final int squadraOspiteId;
  final SquadraModel? squadraCasa;
  final SquadraModel? squadraOspite;
  final DateTime data;
  final int? risultatoCasa;
  final int? risultatoOspite;
  final String? campionato;
  PronosticoModel? pronostico;

  PartitaModel({
    required this.id,
    required this.turnoId,
    required this.squadraCasaId,
    required this.squadraOspiteId,
    this.squadraCasa,
    this.squadraOspite,
    required this.data,
    this.risultatoCasa,
    this.risultatoOspite,
    this.campionato,
    this.pronostico,
  });

  factory PartitaModel.fromJson(Map<String, dynamic> json) {
    return PartitaModel(
      id: json['id'] ?? '',
      turnoId: json['turno_id'] ?? '',
      squadraCasaId: json['squadra_casa_id'] is int 
          ? json['squadra_casa_id'] 
          : int.tryParse(json['squadra_casa_id'].toString()) ?? 0,
      squadraOspiteId: json['squadra_ospite_id'] is int 
          ? json['squadra_ospite_id'] 
          : int.tryParse(json['squadra_ospite_id'].toString()) ?? 0,
      squadraCasa: json['squadra_casa'] != null 
          ? SquadraModel.fromJson(json['squadra_casa']) 
          : null,
      squadraOspite: json['squadra_ospite'] != null 
          ? SquadraModel.fromJson(json['squadra_ospite']) 
          : null,
      data: DateTime.parse(json['data']),
      risultatoCasa: json['risultato_casa'],
      risultatoOspite: json['risultato_ospite'],
      campionato: json['campionato'] ?? 'Elite Maschile',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'turno_id': turnoId,
      'squadra_casa_id': squadraCasaId,
      'squadra_ospite_id': squadraOspiteId,
      'data': data.toIso8601String(),
      'risultato_casa': risultatoCasa,
      'risultato_ospite': risultatoOspite,
      'campionato': campionato,
    };
  }

  bool get hasRisultato => risultatoCasa != null && risultatoOspite != null;
  
  String get nomeSquadraCasa => squadraCasa?.nome ?? 'Squadra Casa';
  String get nomeSquadraOspite => squadraOspite?.nome ?? 'Squadra Ospite';
  
  PronosticoResult? get pronosticoResult {
    if (!hasRisultato || pronostico == null) return null;
    
    // Risultato esatto
    if (risultatoCasa == pronostico!.pronosticoCasa && 
        risultatoOspite == pronostico!.pronosticoOspite) {
      return PronosticoResult.esatto;
    }
    
    // Esito corretto
    final esitoReale = _getEsito(risultatoCasa!, risultatoOspite!);
    final esitoPronostico = _getEsito(pronostico!.pronosticoCasa, pronostico!.pronosticoOspite);
    
    if (esitoReale == esitoPronostico) {
      return PronosticoResult.corretto;
    }
    
    return PronosticoResult.sbagliato;
  }
  
  String _getEsito(int casa, int ospite) {
    if (casa > ospite) return 'home';
    if (casa < ospite) return 'away';
    return 'draw';
  }
  
  int get puntiPronostico {
    switch (pronosticoResult) {
      case PronosticoResult.esatto:
        return 3;
      case PronosticoResult.corretto:
        return 1;
      case PronosticoResult.sbagliato:
      case null:
        return 0;
    }
  }
}

enum PronosticoResult {
  esatto,
  corretto,
  sbagliato,
}



