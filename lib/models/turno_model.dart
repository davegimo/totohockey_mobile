class TurnoModel {
  final String id;
  final String descrizione;
  final DateTime dataLimite;
  final DateTime dataCreazione;

  TurnoModel({
    required this.id,
    required this.descrizione,
    required this.dataLimite,
    required this.dataCreazione,
  });

  factory TurnoModel.fromJson(Map<String, dynamic> json) {
    return TurnoModel(
      id: json['id'] ?? '',
      descrizione: json['descrizione'] ?? '',
      dataLimite: DateTime.parse(json['data_limite']),
      dataCreazione: DateTime.parse(json['data_creazione']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'descrizione': descrizione,
      'data_limite': dataLimite.toIso8601String(),
      'data_creazione': dataCreazione.toIso8601String(),
    };
  }

  bool get isScaduto => DateTime.now().isAfter(dataLimite);
  
  Duration get tempoRimanente {
    final now = DateTime.now();
    if (now.isAfter(dataLimite)) {
      return Duration.zero;
    }
    return dataLimite.difference(now);
  }
}



