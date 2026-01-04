class LegaModel {
  final String id;
  final String nome;
  final String? descrizione;
  final bool isPubblica;
  final String creatoDa;
  final DateTime dataCreazione;
  final DateTime ultimaModifica;
  final bool attiva;
  final String? logoUrl;
  final String? codiceInvito;
  final DateTime? ultimoInvito;
  final int? numeroPartecipanti;
  final String? nomeCreatore;
  final String? cognomeCreatore;

  LegaModel({
    required this.id,
    required this.nome,
    this.descrizione,
    this.isPubblica = false,
    required this.creatoDa,
    required this.dataCreazione,
    required this.ultimaModifica,
    this.attiva = true,
    this.logoUrl,
    this.codiceInvito,
    this.ultimoInvito,
    this.numeroPartecipanti,
    this.nomeCreatore,
    this.cognomeCreatore,
  });

  factory LegaModel.fromJson(Map<String, dynamic> json) {
    return LegaModel(
      id: json['id'] ?? '',
      nome: json['nome'] ?? '',
      descrizione: json['descrizione'],
      isPubblica: json['is_pubblica'] ?? false,
      creatoDa: json['creato_da'] ?? '',
      dataCreazione: DateTime.parse(json['data_creazione']),
      ultimaModifica: DateTime.parse(json['ultima_modifica']),
      attiva: json['attiva'] ?? true,
      logoUrl: json['logo_url'],
      codiceInvito: json['codice_invito'],
      ultimoInvito: json['ultimo_invito'] != null 
          ? DateTime.parse(json['ultimo_invito']) 
          : null,
      numeroPartecipanti: json['numero_partecipanti'],
      nomeCreatore: json['profiles']?['nome'],
      cognomeCreatore: json['profiles']?['cognome'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'nome': nome,
      'descrizione': descrizione,
      'is_pubblica': isPubblica,
      'creato_da': creatoDa,
      'data_creazione': dataCreazione.toIso8601String(),
      'ultima_modifica': ultimaModifica.toIso8601String(),
      'attiva': attiva,
      'logo_url': logoUrl,
      'codice_invito': codiceInvito,
      'ultimo_invito': ultimoInvito?.toIso8601String(),
      'numero_partecipanti': numeroPartecipanti,
    };
  }

  bool get isLinkScaduto {
    if (ultimoInvito == null) return true;
    final now = DateTime.now();
    final diffInHours = now.difference(ultimoInvito!).inHours;
    return diffInHours > 12;
  }

  String get linkInvito {
    if (codiceInvito == null) return '';
    return 'https://totohockey.it/partecipa/$codiceInvito';
  }
}

class ClassificaLegaModel {
  final String id;
  final String giocatoreId;
  final String legaId;
  final String nomeLega;
  final String nome;
  final String cognome;
  final int puntiTotali;
  final int risultatiEsatti;
  final int esitiPresi;
  final bool isAdmin;
  final DateTime dataIngresso;
  final bool isPubblica;
  final int posizione;

  ClassificaLegaModel({
    required this.id,
    required this.giocatoreId,
    required this.legaId,
    required this.nomeLega,
    required this.nome,
    required this.cognome,
    this.puntiTotali = 0,
    this.risultatiEsatti = 0,
    this.esitiPresi = 0,
    this.isAdmin = false,
    required this.dataIngresso,
    this.isPubblica = false,
    this.posizione = 0,
  });

  factory ClassificaLegaModel.fromJson(Map<String, dynamic> json) {
    return ClassificaLegaModel(
      id: json['id'] ?? '',
      giocatoreId: json['giocatore_id'] ?? '',
      legaId: json['lega_id'] ?? '',
      nomeLega: json['nome_lega'] ?? '',
      nome: json['nome'] ?? '',
      cognome: json['cognome'] ?? '',
      puntiTotali: json['punti_totali'] ?? 0,
      risultatiEsatti: json['risultati_esatti'] ?? 0,
      esitiPresi: json['esiti_presi'] ?? 0,
      isAdmin: json['is_admin'] ?? false,
      dataIngresso: DateTime.parse(json['data_ingresso']),
      isPubblica: json['is_pubblica'] ?? false,
      posizione: json['posizione'] ?? 0,
    );
  }

  String get nomeCompleto => '$nome $cognome';
}



