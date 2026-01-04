class UserModel {
  final String id;
  final String nome;
  final String cognome;
  final String email;
  final int punteggio;
  final String? ruolo;
  final int? risultatiEsatti;
  final int? esitiPresi;

  UserModel({
    required this.id,
    required this.nome,
    required this.cognome,
    required this.email,
    this.punteggio = 0,
    this.ruolo,
    this.risultatiEsatti,
    this.esitiPresi,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] ?? json['id_giocatore'] ?? '',
      nome: json['nome'] ?? '',
      cognome: json['cognome'] ?? '',
      email: json['email'] ?? '',
      punteggio: json['punteggio'] ?? json['punti_totali'] ?? 0,
      ruolo: json['ruolo'],
      risultatiEsatti: json['risultati_esatti'],
      esitiPresi: json['esiti_presi'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'nome': nome,
      'cognome': cognome,
      'email': email,
      'punteggio': punteggio,
      'ruolo': ruolo,
      'risultati_esatti': risultatiEsatti,
      'esiti_presi': esitiPresi,
    };
  }

  String get nomeCompleto => '$nome $cognome';
  
  bool get isAdmin => ruolo == 'admin';

  UserModel copyWith({
    String? id,
    String? nome,
    String? cognome,
    String? email,
    int? punteggio,
    String? ruolo,
    int? risultatiEsatti,
    int? esitiPresi,
  }) {
    return UserModel(
      id: id ?? this.id,
      nome: nome ?? this.nome,
      cognome: cognome ?? this.cognome,
      email: email ?? this.email,
      punteggio: punteggio ?? this.punteggio,
      ruolo: ruolo ?? this.ruolo,
      risultatiEsatti: risultatiEsatti ?? this.risultatiEsatti,
      esitiPresi: esitiPresi ?? this.esitiPresi,
    );
  }
}



