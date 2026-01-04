class SquadraModel {
  final int id;
  final String nome;
  final String? logoUrl;
  final String? descrizione;

  SquadraModel({
    required this.id,
    required this.nome,
    this.logoUrl,
    this.descrizione,
  });

  factory SquadraModel.fromJson(Map<String, dynamic> json) {
    return SquadraModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      nome: json['nome'] ?? '',
      logoUrl: json['logo_url'],
      descrizione: json['descrizione'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'nome': nome,
      'logo_url': logoUrl,
      'descrizione': descrizione,
    };
  }
}



