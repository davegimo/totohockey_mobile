import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:postgrest/postgrest.dart';
import '../models/models.dart';

class SupabaseService {
  static final SupabaseClient client = Supabase.instance.client;

  // ==================== AUTH ====================

  static User? get currentUser => client.auth.currentUser;

  static Stream<AuthState> get authStateChanges => client.auth.onAuthStateChange;

  static Future<AuthResponse> signUp({
    required String email,
    required String password,
    required String nome,
    required String cognome,
  }) async {
    return await client.auth.signUp(
      email: email,
      password: password,
      data: {
        'nome': nome,
        'cognome': cognome,
        'punteggio': 0,
      },
    );
  }

  static Future<AuthResponse> signIn({
    required String email,
    required String password,
  }) async {
    return await client.auth.signInWithPassword(
      email: email,
      password: password,
    );
  }

  static Future<void> signOut() async {
    await client.auth.signOut();
  }

  static Future<void> resetPassword(String email) async {
    await client.auth.resetPasswordForEmail(email);
  }

  // ==================== PROFILE ====================

  static Future<UserModel?> getCurrentUserProfile() async {
    final user = currentUser;
    if (user == null) return null;

    final response = await client
        .from('profiles')
        .select()
        .eq('id', user.id)
        .single();

    return UserModel.fromJson(response);
  }

  static Future<UserModel?> getGiocatoreById(String userId) async {
    final response = await client
        .from('vista_giocatori')
        .select('id_giocatore, nome, cognome, email, punti_totali, risultati_esatti, esiti_presi')
        .eq('id_giocatore', userId)
        .single();

    return UserModel(
      id: response['id_giocatore'],
      nome: response['nome'],
      cognome: response['cognome'],
      email: response['email'] ?? '',
      punteggio: response['punti_totali'] ?? 0,
      risultatiEsatti: response['risultati_esatti'],
      esitiPresi: response['esiti_presi'],
    );
  }

  static Future<bool> isAdmin() async {
    final user = currentUser;
    if (user == null) return false;

    final response = await client
        .from('profiles')
        .select('ruolo')
        .eq('id', user.id)
        .single();

    return response['ruolo'] == 'admin';
  }

  // ==================== TURNI ====================

  static Future<List<TurnoModel>> getTurni() async {
    final response = await client
        .from('turni')
        .select()
        .order('data_limite', ascending: false);

    return (response as List)
        .map((json) => TurnoModel.fromJson(json))
        .toList();
  }

  static Future<TurnoModel?> getUltimoTurno() async {
    final response = await client
        .from('turni')
        .select()
        .order('data_creazione', ascending: false)
        .limit(1)
        .maybeSingle();

    if (response == null) return null;
    return TurnoModel.fromJson(response);
  }

  // ==================== PARTITE ====================

  static Future<List<PartitaModel>> getPartite({String? turnoId}) async {
    PostgrestFilterBuilder query = client.from('partite').select('''
      *,
      squadra_casa:squadra_casa_id(id, nome, logo_url),
      squadra_ospite:squadra_ospite_id(id, nome, logo_url)
    ''');

    if (turnoId != null) {
      query = query.eq('turno_id', turnoId);
    }

    final response = await query.order('data');

    return (response as List).map((json) {
      json['campionato'] = json['campionato'] ?? 'Elite Maschile';
      return PartitaModel.fromJson(json);
    }).toList();
  }

  static Future<List<PartitaModel>> getPartiteConPronostici({
    required String userId,
    String? turnoId,
  }) async {
    final partite = await getPartite(turnoId: turnoId);
    final pronostici = await getPronosticiUtente(userId);

    for (var partita in partite) {
      final pronostico = pronostici.firstWhere(
        (p) => p.partitaId == partita.id,
        orElse: () => PronosticoModel(
          id: '',
          userId: '',
          partitaId: '',
          pronosticoCasa: 0,
          pronosticoOspite: 0,
        ),
      );
      if (pronostico.id.isNotEmpty) {
        partita.pronostico = pronostico;
      }
    }

    return partite;
  }

  // ==================== PRONOSTICI ====================

  static Future<List<PronosticoModel>> getPronosticiUtente(String userId) async {
    final response = await client
        .from('pronostici')
        .select()
        .eq('user_id', userId);

    return (response as List)
        .map((json) => PronosticoModel.fromJson(json))
        .toList();
  }

  static Future<void> savePronostico({
    required String userId,
    required String partitaId,
    required int pronosticoCasa,
    required int pronosticoOspite,
  }) async {
    // Verifica se esiste già
    final existing = await client
        .from('pronostici')
        .select('id')
        .eq('user_id', userId)
        .eq('partita_id', partitaId)
        .maybeSingle();

    if (existing != null) {
      // Aggiorna
      await client.from('pronostici').update({
        'pronostico_casa': pronosticoCasa,
        'pronostico_ospite': pronosticoOspite,
      }).eq('id', existing['id']);
    } else {
      // Inserisci
      await client.from('pronostici').insert({
        'user_id': userId,
        'partita_id': partitaId,
        'pronostico_casa': pronosticoCasa,
        'pronostico_ospite': pronosticoOspite,
      });
    }
  }

  // ==================== CLASSIFICA ====================

  static Future<List<Map<String, dynamic>>> getClassifica() async {
    // Carica tutti i dati in una singola query senza limiti
    final response = await client
        .from('vista_giocatori')
        .select('id_giocatore, nome, cognome, punti_totali, risultati_esatti, esiti_presi')
        .order('punti_totali', ascending: false)
        .order('risultati_esatti', ascending: false)
        .order('esiti_presi', ascending: false);

    // Converti e ritorna tutti i dati in blocco
    return List<Map<String, dynamic>>.from(response);
  }

  // ==================== LEGHE ====================

  static Future<List<LegaModel>> getLegheUtente() async {
    final user = currentUser;
    if (user == null) return [];

    final legheMembroResponse = await client
        .from('giocatori_leghe')
        .select('lega_id')
        .eq('giocatore_id', user.id);

    final legheIds = (legheMembroResponse as List)
        .map((item) => item['lega_id'] as String)
        .toList();

    if (legheIds.isEmpty) return [];

    final response = await client
        .from('leghe')
        .select()
        .inFilter('id', legheIds);

    return (response as List)
        .map((json) => LegaModel.fromJson(json))
        .toList();
  }

  static Future<LegaModel?> getLegaById(String legaId) async {
    final response = await client
        .from('leghe')
        .select()
        .eq('id', legaId)
        .single();

    return LegaModel.fromJson(response);
  }

  static Future<LegaModel> creaLega({
    required String nome,
    String? descrizione,
    bool isPubblica = false,
  }) async {
    final user = currentUser;
    if (user == null) throw Exception('Utente non autenticato');

    final response = await client
        .from('leghe')
        .insert({
          'nome': nome,
          'descrizione': descrizione,
          'is_pubblica': isPubblica,
          'creato_da': user.id,
        })
        .select()
        .single();

    return LegaModel.fromJson(response);
  }

  static Future<List<ClassificaLegaModel>> getClassificaLega(String legaId) async {
    final response = await client
        .from('vista_classifica_leghe')
        .select()
        .eq('lega_id', legaId)
        .order('posizione', ascending: true);

    return (response as List)
        .map((json) => ClassificaLegaModel.fromJson(json))
        .toList();
  }

  static Future<bool> isLegaAdmin(String legaId) async {
    final user = currentUser;
    if (user == null) return false;

    final response = await client
        .from('giocatori_leghe')
        .select('is_admin')
        .eq('giocatore_id', user.id)
        .eq('lega_id', legaId)
        .maybeSingle();

    return response?['is_admin'] ?? false;
  }

  static Future<Map<String, dynamic>> partecipaLegaConCodice(String codiceInvito) async {
    final user = currentUser;
    if (user == null) throw Exception('Utente non autenticato');

    final response = await client.rpc('partecipa_lega_con_codice', params: {
      'p_codice_invito': codiceInvito,
      'p_user_id': user.id,
    });

    return response as Map<String, dynamic>;
  }

  static Future<LegaModel?> getLegaByInviteCode(String codiceInvito) async {
    final response = await client.rpc('cerca_lega_per_codice', params: {
      'p_codice_invito': codiceInvito,
    });

    if (response == null) return null;
    return LegaModel.fromJson(response);
  }

  static Future<String?> rigeneraLinkInvito(String legaId) async {
    final isAdmin = await isLegaAdmin(legaId);
    if (!isAdmin) throw Exception('Non hai i permessi');

    final nuovoCodice = _generateRandomCode(8);

    await client.from('leghe').update({
      'codice_invito': nuovoCodice,
      'ultimo_invito': DateTime.now().toIso8601String(),
    }).eq('id', legaId);

    return nuovoCodice;
  }

  static String _generateRandomCode(int length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    final random = DateTime.now().millisecondsSinceEpoch;
    return List.generate(length, (index) {
      return chars[(random + index * 7) % chars.length];
    }).join();
  }

  // ==================== SQUADRE ====================

  static Future<List<SquadraModel>> getSquadre() async {
    final response = await client
        .from('squadre')
        .select()
        .order('nome');

    return (response as List)
        .map((json) => SquadraModel.fromJson(json))
        .toList();
  }
}

