class PronosticoModel {
  final String id;
  final String userId;
  final String partitaId;
  final int pronosticoCasa;
  final int pronosticoOspite;
  final int? punti;

  PronosticoModel({
    required this.id,
    required this.userId,
    required this.partitaId,
    required this.pronosticoCasa,
    required this.pronosticoOspite,
    this.punti,
  });

  factory PronosticoModel.fromJson(Map<String, dynamic> json) {
    return PronosticoModel(
      id: json['id'] ?? '',
      userId: json['user_id'] ?? '',
      partitaId: json['partita_id'] ?? '',
      pronosticoCasa: json['pronostico_casa'] ?? 0,
      pronosticoOspite: json['pronostico_ospite'] ?? 0,
      punti: json['punti'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'partita_id': partitaId,
      'pronostico_casa': pronosticoCasa,
      'pronostico_ospite': pronosticoOspite,
      'punti': punti,
    };
  }

  PronosticoModel copyWith({
    String? id,
    String? userId,
    String? partitaId,
    int? pronosticoCasa,
    int? pronosticoOspite,
    int? punti,
  }) {
    return PronosticoModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      partitaId: partitaId ?? this.partitaId,
      pronosticoCasa: pronosticoCasa ?? this.pronosticoCasa,
      pronosticoOspite: pronosticoOspite ?? this.pronosticoOspite,
      punti: punti ?? this.punti,
    );
  }
}



