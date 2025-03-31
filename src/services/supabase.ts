import { createClient } from '@supabase/supabase-js';

// Supabase credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://example.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4YW1wbGUiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjQyMjY0Nywic3ViIjoiYW5vbiJ9.example';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.error('Supabase credentials missing. Please configure environment variables in .env file');
  console.warn('App will run in demo mode with mock data.');
}

// Create a single Supabase client instance
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'totohockey-auth',
    autoRefreshToken: true,
    detectSessionInUrl: false
  }
});

// User types
export type User = {
  id: string;
  nome: string;
  cognome: string;
  email: string;
  punteggio: number;
};

// Team types
export type Squadra = {
  id: number;
  nome: string;
  logo_url?: string;
  descrizione?: string;
};

// Match types
export type Turno = {
  id: string;
  descrizione: string;
  data_limite: string;
  data_creazione: string;
};

export type Partita = {
  id: string;
  turno_id: string;
  squadra_casa_id: number;
  squadra_ospite_id: number;
  squadra_casa?: Squadra;
  squadra_ospite?: Squadra;
  data: string;
  risultato_casa?: number;
  risultato_ospite?: number;
  campionato?: string; // Elite Maschile o Elite Femminile
};

export type Pronostico = {
  id: string;
  user_id: string;
  partita_id: string;
  pronostico_casa: number;
  pronostico_ospite: number;
  punti?: number;
};

// Profile data type
export type ProfileData = {
  id: string;
  nome: string;
  cognome: string;
  email: string;
  punteggio: number;
  ruolo?: string;
  risultati_esatti?: number;
  esiti_presi?: number;
};

// Tipi per le leghe
export interface Lega {
  id: string;
  nome: string;
  descrizione?: string;
  is_pubblica: boolean;
  creato_da: string;
  data_creazione: string;
  ultima_modifica: string;
  attiva: boolean;
  logo_url?: string;
  codice_invito?: string;
  ultimo_invito?: string | null;
  link_scaduto?: boolean;
  numero_partecipanti?: number;
  profiles?: {
    nome?: string;
    cognome?: string;
  };
}

export type GiocatoreLega = {
  id: string;
  giocatore_id: string;
  lega_id: string;
  punti_totali: number;
  risultati_esatti: number;
  esiti_presi: number;
  data_ingresso: string;
  is_admin: boolean;
  ultima_modifica: string;
};

export type ClassificaLega = {
  id: string;
  giocatore_id: string;
  lega_id: string;
  nome_lega: string;
  nome: string;
  cognome: string;
  punti_totali: number;
  risultati_esatti: number;
  esiti_presi: number;
  is_admin: boolean;
  data_ingresso: string;
  is_pubblica: boolean;
  posizione: number;
};

export type TopPerformer = {
  nome_giocatore: string;
  cognome_giocatore: string;
  turno: string;
  punti_totali: number;
};

// Authentication functions
export const signUp = async (email: string, password: string, nome: string, cognome: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nome,
        cognome,
        punteggio: 0
      }
    }
  });
  
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { data, error };
  } catch (err) {
    return { 
      data: null, 
      error: { message: 'Errore durante il login' } 
    };
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    return { error };
  } catch (err) {
    return { error: { message: 'Errore durante il logout' } };
  }
};

// Funzione per ottenere l'utente corrente
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }
    
    // Ottieni il profilo dell'utente
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError || !profile) {
      return null;
    }
    
    return {
      id: user.id,
      email: user.email || '',
      nome: profile.nome || '',
      cognome: profile.cognome || '',
      punteggio: profile.punteggio || 0
    };
  } catch (error) {
    console.error('Errore nel recupero dell\'utente corrente:', error);
    return null;
  }
};

export const isAdmin = async () => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { isAdminUser: false, error: 'Utente non autenticato' };
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('ruolo')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Errore durante il controllo del ruolo:', error);
      return { isAdminUser: false, error };
    }

    const isAdminUser = data?.ruolo === 'admin';
    return { isAdminUser, error: null };
  } catch (error) {
    console.error('Errore durante il controllo del ruolo:', error);
    return { isAdminUser: false, error };
  }
};

// Team functions
export const getSquadre = async () => {
  const { data, error } = await supabase
    .from('squadre')
    .select('*')
    .order('nome');
  
  return { squadre: (data || []) as Squadra[], error };
};

// Turno functions
export const getTurni = async () => {
  const { data, error } = await supabase
    .from('turni')
    .select('*')
    .order('data_limite', { ascending: false });
  
  return { turni: (data || []) as Turno[], error };
};

export const getUltimoTurno = async () => {
  const { data, error } = await supabase
    .from('turni')
    .select('*')
    .order('data_creazione', { ascending: false })
    .limit(1)
    .single();
  
  return { turno: data as Turno | null, error };
};

export const getTurnoById = async (turnoId: string) => {
  const { data, error } = await supabase
    .from('turni')
    .select('*')
    .eq('id', turnoId)
    .single();
  
  return { turno: data as Turno | null, error };
};

export const createTurno = async (turno: {
  descrizione: string;
  data_limite: string;
}) => {
  try {
    console.log('Creazione nuovo turno:', turno);
    const { data, error } = await supabase
      .from('turni')
      .insert([turno])
      .select();

    if (error) {
      console.error('Errore durante la creazione del turno:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Errore durante la creazione del turno:', error);
    return { data: null, error };
  }
};

export const deleteTurno = async (turnoId: string) => {
  try {
    console.log('Tentativo di eliminazione turno con ID:', turnoId);
    
    // Prima verifichiamo se ci sono partite associate a questo turno
    const { data: partite, error: partiteError } = await supabase
      .from('partite')
      .select('id')
      .eq('turno_id', turnoId);
      
    if (partiteError) {
      console.error('Errore durante la verifica delle partite associate:', partiteError);
      return { success: false, error: partiteError };
    }
    
    if (partite && partite.length > 0) {
      const error = new Error(`Impossibile eliminare il turno: ci sono ${partite.length} partite associate`);
      console.error(error);
      return { success: false, error };
    }
    
    // Se non ci sono partite associate, eliminiamo il turno
    const { error } = await supabase
      .from('turni')
      .delete()
      .eq('id', turnoId);

    if (error) {
      console.error('Errore durante l\'eliminazione del turno:', error);
      return { success: false, error };
    }

    console.log('Turno eliminato con successo');
    return { success: true, error: null };
  } catch (error) {
    console.error('Errore durante l\'eliminazione del turno:', error);
    return { success: false, error };
  }
};

// Match functions
export const getPartite = async (turnoId?: string) => {
  let query = supabase
    .from('partite')
    .select(`
      *,
      squadra_casa:squadra_casa_id(id, nome, logo_url),
      squadra_ospite:squadra_ospite_id(id, nome, logo_url)
    `)
    .order('data');
  
  if (turnoId) {
    query = query.eq('turno_id', turnoId);
  }
  
  const { data, error } = await query;
  
  // Assicuriamoci che il campo campionato sia sempre definito
  const partiteConCampionato = data?.map(partita => ({
    ...partita,
    campionato: partita.campionato || 'Elite Maschile'
  }));
  
  return { partite: (partiteConCampionato || []) as Partita[], error };
};

// Pronostico functions
export const getPronostici = async (userId: string) => {
  const { data, error } = await supabase
    .from('pronostici')
    .select('*')
    .eq('user_id', userId);
  
  return { pronostici: data || [], error };
};

export const getPronosticiWithDetails = async (userId: string) => {
  try {
    console.log('Recupero pronostici con dettagli per utente:', userId);
    
    const { data, error } = await supabase
      .from('pronostici')
      .select(`
        *,
        partita:partita_id(
          id,
          data,
          risultato_casa,
          risultato_ospite,
          campionato,
          squadra_casa:squadra_casa_id(id, nome, logo_url),
          squadra_ospite:squadra_ospite_id(id, nome, logo_url),
          turno:turno_id(id, descrizione, data_limite)
        )
      `)
      .eq('user_id', userId);
    
    if (error) {
      console.error('Errore durante il recupero dei pronostici:', error);
      return { pronosticiConDettagli: [], error };
    }
    
    // Assicuriamoci che il campo campionato sia sempre definito
    const pronosticiConCampionato = data?.map(pronostico => {
      // Verifica che l'oggetto partita esista prima di accedere alle sue proprietà
      if (!pronostico.partita) {
        console.warn('Pronostico senza partita valida trovato:', pronostico.id);
        return null; // Escluderemo questo pronostico dai risultati
      }
      
      return {
        ...pronostico,
        partita: {
          ...pronostico.partita,
          campionato: pronostico.partita.campionato || 'Elite Maschile'
        }
      };
    }).filter(Boolean); // Rimuove gli elementi null
    
    // Organizziamo i pronostici per turno
    const pronosticiPerTurno: Record<string, any[]> = {};
    
    pronosticiConCampionato?.forEach(pronostico => {
      // Verifica che l'oggetto partita e turno esistano prima di accedere alle proprietà
      if (!pronostico.partita || !pronostico.partita.turno) {
        console.warn('Pronostico con struttura incompleta trovato:', pronostico.id);
        return; // Salta questo pronostico
      }
      
      const turnoId = pronostico.partita.turno.id;
      if (!pronosticiPerTurno[turnoId]) {
        pronosticiPerTurno[turnoId] = [];
      }
      pronosticiPerTurno[turnoId].push(pronostico);
    });
    
    // Se non ci sono pronostici validi, restituisci un array vuoto
    if (Object.keys(pronosticiPerTurno).length === 0) {
      return { turniConPronostici: [], error: null };
    }
    
    // Convertiamo l'oggetto in un array ordinato per data_limite del turno (decrescente)
    const turniConPronostici = Object.entries(pronosticiPerTurno).map(([, pronostici]) => {
      const turno = pronostici[0].partita.turno;
      return {
        turno,
        pronostici
      };
    }).sort((a, b) => {
      const dataA = new Date(a.turno.data_limite).getTime();
      const dataB = new Date(b.turno.data_limite).getTime();
      return dataB - dataA; // Ordine decrescente
    });
    
    return { turniConPronostici, error: null };
  } catch (error) {
    console.error('Errore durante l\'elaborazione dei pronostici:', error);
    return { turniConPronostici: [], error };
  }
};

export const getUserById = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Errore durante il recupero del profilo utente:', error);
      return { user: null, error };
    }
    
    return { user: data as ProfileData, error: null };
  } catch (error) {
    console.error('Errore durante il recupero del profilo utente:', error);
    return { user: null, error };
  }
};

// Nuova funzione che recupera i dati del giocatore dalla vista vista_giocatori
export const getGiocatoreById = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('vista_giocatori')
      .select('id_giocatore, nome, cognome, email, punti_totali, risultati_esatti, esiti_presi')
      .eq('id_giocatore', userId)
      .single();
    
    if (error) {
      console.error('Errore durante il recupero del profilo giocatore:', error);
      return { user: null, error };
    }
    
    // Convertiamo il formato per mantenere la compatibilità con ProfileData
    const user: ProfileData = {
      id: data.id_giocatore,
      nome: data.nome,
      cognome: data.cognome,
      email: data.email,
      punteggio: data.punti_totali,
      risultati_esatti: data.risultati_esatti,
      esiti_presi: data.esiti_presi
    };
    
    return { user, error: null };
  } catch (error) {
    console.error('Errore durante il recupero del profilo giocatore:', error);
    return { user: null, error };
  }
};

// Nuova funzione per recuperare i dati del giocatore specifici di una lega
export const getGiocatoreByIdInLega = async (userId: string, legaId: string) => {
  try {
    const { data, error } = await supabase
      .from('vista_classifica_leghe')
      .select('giocatore_id, nome, cognome, punti_totali, risultati_esatti, esiti_presi')
      .eq('giocatore_id', userId)
      .eq('lega_id', legaId)
      .single();
    
    if (error) {
      console.error('Errore durante il recupero del profilo giocatore nella lega:', error);
      return { user: null, error };
    }
    
    // Convertiamo il formato per mantenere la compatibilità con ProfileData
    const user: ProfileData = {
      id: data.giocatore_id,
      nome: data.nome,
      cognome: data.cognome,
      email: '', // Non abbiamo questa info dalla vista delle leghe
      punteggio: data.punti_totali,
      risultati_esatti: data.risultati_esatti,
      esiti_presi: data.esiti_presi
    };
    
    return { user, error: null };
  } catch (error) {
    console.error('Errore durante il recupero del profilo giocatore nella lega:', error);
    return { user: null, error };
  }
};

export const savePronostico = async (pronostico: {
  user_id: string;
  partita_id: string;
  pronostico_casa: number;
  pronostico_ospite: number;
}) => {
  // Verifica se esiste già un pronostico per questa partita
  const { data: existingPronostico, error: checkError } = await supabase
    .from('pronostici')
    .select('id')
    .eq('user_id', pronostico.user_id)
    .eq('partita_id', pronostico.partita_id)
    .single();
  
  if (checkError && checkError.code !== 'PGRST116') {
    return { error: checkError };
  }
  
  if (existingPronostico) {
    // Aggiorna il pronostico esistente
    const { error } = await supabase
      .from('pronostici')
      .update({
        pronostico_casa: pronostico.pronostico_casa,
        pronostico_ospite: pronostico.pronostico_ospite
      })
      .eq('id', existingPronostico.id);
    
    return { error };
  } else {
    // Crea un nuovo pronostico
    const { error } = await supabase
      .from('pronostici')
      .insert([pronostico]);
    
    return { error };
  }
};

export const createPartita = async (
  turno_id: string,
  squadra_casa_id: number,
  squadra_ospite_id: number,
  data: string,
  campionato: string
) => {
  try {
    const { data: partita, error } = await supabase
      .from('partite')
      .insert({
        turno_id,
        squadra_casa_id,
        squadra_ospite_id,
        data,
        campionato
      })
      .select()
      .single();

    if (error) {
      console.error('Errore nella creazione della partita:', error);
      return { partita: null, error };
    }

    return { partita, error: null };
  } catch (error) {
    console.error('Errore nella creazione della partita:', error);
    return { partita: null, error };
  }
};

export const deletePartita = async (partitaId: string) => {
  try {
    console.log('Tentativo di eliminazione partita con ID:', partitaId);
    
    // Prima eliminiamo i pronostici associati alla partita
    console.log('Eliminazione pronostici associati...');
    const { error: pronosticiError } = await supabase
      .from('pronostici')
      .delete()
      .eq('partita_id', partitaId);
      
    if (pronosticiError) {
      console.error('Errore durante l\'eliminazione dei pronostici associati:', pronosticiError);
      return { success: false, error: pronosticiError };
    }
    
    console.log('Pronostici associati eliminati con successo, ora elimino la partita');
    
    // Poi eliminiamo la partita
    const { error } = await supabase
      .from('partite')
      .delete()
      .eq('id', partitaId);

    if (error) {
      console.error('Errore durante l\'eliminazione della partita:', error);
      return { success: false, error };
    }

    console.log('Partita eliminata con successo');
    return { success: true, error: null };
  } catch (error) {
    console.error('Errore durante l\'eliminazione della partita:', error);
    return { success: false, error };
  }
};

export const updateRisultatoPartita = async (partitaId: string, risultatoCasa: number, risultatoOspite: number) => {
  try {
    console.log('Aggiornamento risultato partita:', { partitaId, risultatoCasa, risultatoOspite });
    
    const { data, error } = await supabase
      .from('partite')
      .update({
        risultato_casa: risultatoCasa,
        risultato_ospite: risultatoOspite
      })
      .eq('id', partitaId)
      .select();

    if (error) {
      console.error('Errore durante l\'aggiornamento del risultato:', error);
      return { success: false, error };
    }

    console.log('Risultato aggiornato con successo:', data);
    
    // Aggiorna i punteggi dei pronostici
    await aggiornaPronosticiPunti(partitaId, risultatoCasa, risultatoOspite);
    
    return { success: true, data, error: null };
  } catch (error) {
    console.error('Errore durante l\'aggiornamento del risultato:', error);
    return { success: false, error };
  }
};

// Funzione per aggiornare i punteggi dei pronostici in base al risultato
const aggiornaPronosticiPunti = async (partitaId: string, risultatoCasa: number, risultatoOspite: number) => {
  try {
    console.log(`Aggiornamento punti per i pronostici della partita ${partitaId}`);
    
    // Prima otteniamo il numero totale di pronostici per questa partita
    const { count: totalPronostici, error: countError } = await supabase
      .from('pronostici')
      .select('*', { count: 'exact', head: true })
      .eq('partita_id', partitaId);
      
    if (countError) {
      console.error('Errore nel conteggio dei pronostici:', countError);
    } else {
      console.log(`Trovati ${totalPronostici} pronostici da aggiornare per questa partita`);
    }
    
    // Aggiorna i pronostici con risultato esatto (3 punti)
    const { error: errorRisultatoEsatto } = await supabase.rpc('aggiorna_punti_risultato_esatto', {
      p_partita_id: partitaId,
      p_risultato_casa: risultatoCasa,
      p_risultato_ospite: risultatoOspite
    });
    
    // Verifichiamo quanti pronostici sono stati aggiornati con risultato esatto
    const { count: countEsatti } = await supabase
      .from('pronostici')
      .select('*', { count: 'exact', head: true })
      .eq('partita_id', partitaId)
      .eq('punti', 3);
        
    if (errorRisultatoEsatto) {
      console.error('Errore nell\'aggiornamento dei punti per risultato esatto:', errorRisultatoEsatto);
    } else {
      console.log(`Aggiornamento punti per risultato esatto completato: ${countEsatti || 0} pronostici con risultato esatto`);
    }
    
    // Aggiorna i pronostici con esito corretto (1 punto)
    const { error: errorEsitoCorretto } = await supabase.rpc('aggiorna_punti_esito_corretto', {
      p_partita_id: partitaId,
      p_risultato_casa: risultatoCasa,
      p_risultato_ospite: risultatoOspite
    });
    
    // Verifichiamo quanti pronostici sono stati aggiornati con esito corretto
    const { count: countEsiti } = await supabase
      .from('pronostici')
      .select('*', { count: 'exact', head: true })
      .eq('partita_id', partitaId)
      .eq('punti', 1);
    
    if (errorEsitoCorretto) {
      console.error('Errore nell\'aggiornamento dei punti per esito corretto:', errorEsitoCorretto);
    } else {
      console.log(`Aggiornamento punti per esito corretto completato: ${countEsiti || 0} pronostici con esito corretto`);
    }
    
    // Aggiorna i pronostici con risultato sbagliato (0 punti)
    const { error: errorRisultatoSbagliato } = await supabase.rpc('aggiorna_punti_risultato_sbagliato', {
      p_partita_id: partitaId
    });
    
    // Verifichiamo quanti pronostici sono stati aggiornati con risultato sbagliato
    const { count: countSbagliati } = await supabase
      .from('pronostici')
      .select('*', { count: 'exact', head: true })
      .eq('partita_id', partitaId)
      .eq('punti', 0);
    
    if (errorRisultatoSbagliato) {
      console.error('Errore nell\'aggiornamento dei punti per risultato sbagliato:', errorRisultatoSbagliato);
    } else {
      console.log(`Aggiornamento punti per risultato sbagliato completato: ${countSbagliati || 0} pronostici con risultato sbagliato`);
    }
    
    console.log('Punti dei pronostici aggiornati con successo');
    
    // Aggiorna i punteggi totali degli utenti
    await aggiornaClassificaMassiva();
    
  } catch (error) {
    console.error('Errore durante l\'aggiornamento dei punti:', error);
  }
};

// Funzione per aggiornare la classifica generale in modo massivo
const aggiornaClassificaMassiva = async () => {
  try {
    console.log('Inizio aggiornamento classifica generale in modo massivo...');
    
    // Aggiorna i punteggi di tutti gli utenti in una singola query
    const { error } = await supabase.rpc('aggiorna_punteggi_utenti');
    
    if (error) {
      console.error('Errore nell\'aggiornamento massivo della classifica:', error);
      return;
    }
    
    console.log('Classifica aggiornata con successo in modo massivo');
    
  } catch (error) {
    console.error('Errore durante l\'aggiornamento della classifica:', error);
  }
};

// Classifica functions
export const getClassifica = async () => {
  const { data, error } = await supabase
    .from('vista_giocatori')
    .select('id_giocatore, nome, cognome, punti_totali, risultati_esatti, esiti_presi')
    .order('punti_totali', { ascending: false })
    .order('risultati_esatti', { ascending: false })
    .order('esiti_presi', { ascending: false });
  
  return { classifica: data || [], error };
};

export const ricalcolaPunteggiUtenti = async () => {
  try {
    console.log('Avvio ricalcolo punteggi per tutti gli utenti...');
    
    // Verifica che l'utente sia admin
    const { isAdminUser, error: adminError } = await isAdmin();
    if (!isAdminUser || adminError) {
      console.error('Solo gli admin possono ricalcolare i punteggi di tutti gli utenti');
      return { success: false, error: 'Permessi insufficienti' };
    }
    
    // Ottieni tutte le partite con risultati
    const { data: partite, error: partiteError } = await supabase
      .from('partite')
      .select('*')
      .not('risultato_casa', 'is', null)
      .not('risultato_ospite', 'is', null);
      
    if (partiteError || !partite) {
      console.error('Errore nel recupero delle partite con risultati:', partiteError);
      return { success: false, error: partiteError };
    }
    
    console.log(`Trovate ${partite.length} partite con risultati da elaborare`);
    
    // Per ogni partita, aggiorna i punti dei pronostici
    for (const partita of partite) {
      await aggiornaPronosticiPunti(partita.id, partita.risultato_casa, partita.risultato_ospite);
    }
    
    // Aggiorna la classifica generale in modo massivo
    await aggiornaClassificaMassiva();
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Errore durante il ricalcolo dei punteggi:', error);
    return { success: false, error };
  }
};

// Funzioni per le leghe
export const getLegheUtente = async () => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData.user) {
      throw new Error('Utente non autenticato');
    }
    
    // Prima ottieni gli ID delle leghe dell'utente
    const { data: legheMembro, error: errorLegheMembro } = await supabase
      .from('giocatori_leghe')
      .select('lega_id')
      .eq('giocatore_id', userData.user.id);
    
    if (errorLegheMembro) {
      throw errorLegheMembro;
    }
    
    // Estrai gli ID delle leghe
    const legheIds = legheMembro.map(item => item.lega_id);
    
    // Se l'utente non è membro di alcuna lega, restituisci un array vuoto
    if (legheIds.length === 0) {
      return { leghe: [], error: null };
    }
    
    // Ottieni i dettagli delle leghe
    const { data, error } = await supabase
      .from('leghe')
      .select('*')
      .in('id', legheIds);
    
    if (error) {
      throw error;
    }
    
    return { leghe: data as Lega[], error: null };
  } catch (error) {
    console.error('Errore nel recupero delle leghe:', error);
    return { leghe: [], error };
  }
};

export const creaLega = async (nome: string, descrizione?: string, logo?: File, is_pubblica: boolean = false) => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData.user) {
      throw new Error('Utente non autenticato');
    }
    
    let logo_url = null;
    
    // Se è stato fornito un logo, caricalo in storage
    if (logo) {
      const fileExt = logo.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `loghi_leghe/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('loghi')
        .upload(filePath, logo);
      
      if (uploadError) {
        throw uploadError;
      }
      
      // Ottieni l'URL pubblico del logo caricato
      const { data: urlData } = supabase.storage
        .from('loghi')
        .getPublicUrl(filePath);
      
      logo_url = urlData.publicUrl;
    }
    
    // Inserisci la nuova lega
    const { data, error } = await supabase
      .from('leghe')
      .insert({
        nome,
        descrizione,
        is_pubblica,
        creato_da: userData.user.id,
        logo_url
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return { lega: data as Lega, error: null };
  } catch (error) {
    console.error('Errore nella creazione della lega:', error);
    return { lega: null, error };
  }
};

export const getClassificaLega = async (legaId: string) => {
  try {
    const { data, error } = await supabase
      .from('vista_classifica_leghe')
      .select('*')
      .eq('lega_id', legaId)
      .order('posizione', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return { classifica: data as ClassificaLega[], error: null };
  } catch (error) {
    console.error('Errore nel recupero della classifica della lega:', error);
    return { classifica: [], error };
  }
};

export const isLegaAdmin = async (legaId: string) => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData.user) {
      return { isAdmin: false, error: new Error('Utente non autenticato') };
    }
    
    const { data, error } = await supabase
      .from('giocatori_leghe')
      .select('is_admin')
      .eq('giocatore_id', userData.user.id)
      .eq('lega_id', legaId)
      .single();
    
    if (error) {
      return { isAdmin: false, error };
    }
    
    return { isAdmin: data.is_admin, error: null };
  } catch (error) {
    console.error('Errore nella verifica dei permessi admin:', error);
    return { isAdmin: false, error };
  }
};

export const partecipaLegaConCodice = async (codiceInvito: string) => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData.user) {
      throw new Error('Utente non autenticato');
    }
    
    console.log('[partecipaLegaConCodice] Chiamata RPC per partecipa_lega_con_codice con codice:', codiceInvito);
    
    // Utilizziamo una funzione RPC con SECURITY DEFINER per bypassare RLS
    const { data, error } = await supabase.rpc('partecipa_lega_con_codice', {
      p_codice_invito: codiceInvito,
      p_user_id: userData.user.id
    });
    
    console.log('[partecipaLegaConCodice] Risposta dalla RPC:', data, error);
    
    if (error) {
      console.error('[partecipaLegaConCodice] Errore nella chiamata RPC:', error);
      throw error;
    }
    
    if (!data) {
      throw new Error('Si è verificato un errore durante la partecipazione alla lega');
    }
    
    // La funzione RPC restituisce un oggetto con i campi success, message e lega
    return data;
  } catch (error) {
    console.error('Errore nell\'entrare nella lega:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Errore sconosciuto',
      lega: null 
    };
  }
};

export const invitaGiocatoreLega = async (emailGiocatore: string, legaId: string) => {
  try {
    // Verifica che l'utente attuale sia admin della lega
    const { isAdmin, error: adminError } = await isLegaAdmin(legaId);
    
    if (!isAdmin || adminError) {
      throw new Error('Non hai i permessi per invitare giocatori in questa lega');
    }
    
    // Ottieni il codice di invito della lega
    const { data: legaData, error: legaError } = await supabase
      .from('leghe')
      .select('nome, codice_invito')
      .eq('id', legaId)
      .single();
    
    if (legaError || !legaData) {
      throw new Error('Lega non trovata');
    }
    
    // Ottieni l'utente tramite email
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', emailGiocatore)
      .maybeSingle();
    
    if (userError) {
      throw userError;
    }
    
    // Se l'utente non esiste, invia comunque un messaggio di successo
    // (per ragioni di privacy, non rivelare se l'email esiste o meno)
    if (!userData) {
      return { 
        success: true, 
        message: `Invito inviato all'indirizzo ${emailGiocatore}` 
      };
    }
    
    // Controlla se l'utente è già nella lega
    const { data: existingMember } = await supabase
      .from('giocatori_leghe')
      .select('id')
      .eq('giocatore_id', userData.id)
      .eq('lega_id', legaId)
      .maybeSingle();
    
    if (existingMember) {
      return { 
        success: true, 
        message: `L'utente è già un membro della lega ${legaData.nome}` 
      };
    }
    
    // Invia l'email di invito (questa è solo una simulazione, l'implementazione reale dipende dal sistema di invio email)
    // In un sistema reale, qui userei una funzione Edge o una funzione Cloud per inviare l'email
    console.log(`Invio invito a ${emailGiocatore} per la lega ${legaData.nome} con codice ${legaData.codice_invito}`);
    
    return { 
      success: true, 
      message: `Invito inviato all'indirizzo ${emailGiocatore}` 
    };
  } catch (error) {
    console.error('Errore nell\'invitare il giocatore:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Errore sconosciuto' 
    };
  }
};

// Nuova funzione per ottenere una lega per ID, utile in LegaPage
export const getLegaById = async (legaId: string) => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData.user) {
      throw new Error('Utente non autenticato');
    }
    
    // Query diretta per ottenere i dettagli della lega
    const { data, error } = await supabase
      .from('leghe')
      .select('*')
      .eq('id', legaId)
      .single();
    
    if (error) {
      throw error;
    }
    
    // Verifica che l'utente sia membro della lega privata
    if (!data.is_pubblica) {
      const { data: membership, error: membershipError } = await supabase
        .from('giocatori_leghe')
        .select('id')
        .eq('giocatore_id', userData.user.id)
        .eq('lega_id', legaId)
        .maybeSingle();
      
      if (membershipError || !membership) {
        throw new Error('Non sei membro di questa lega privata');
      }
    }
    
    return { lega: data as Lega, error: null };
  } catch (error) {
    console.error('Errore nel recupero della lega:', error);
    return { lega: null, error };
  }
};

// Aggiorniamo la funzione getGiocatoriLega per ottenere i membri di una lega
export const getGiocatoriLega = async (legaId: string) => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData.user) {
      throw new Error('Utente non autenticato');
    }
    
    // Verifica che la lega sia pubblica o che l'utente sia il creatore
    const { data: lega, error: legaError } = await supabase
      .from('leghe')
      .select('*')
      .eq('id', legaId)
      .single();
    
    if (legaError || !lega) {
      throw new Error('Lega non trovata');
    }
    
    // Se è una lega pubblica o l'utente è il creatore, ottieni tutti i membri
    if (lega.is_pubblica || lega.creato_da === userData.user.id) {
      const { data, error } = await supabase
        .from('vista_classifica_leghe')
        .select('*')
        .eq('lega_id', legaId)
        .order('posizione', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      return { giocatori: data as ClassificaLega[], error: null };
    } else {
      // Altrimenti, verifica che l'utente sia membro della lega
      const { data: membership, error: membershipError } = await supabase
        .from('giocatori_leghe')
        .select('id')
        .eq('giocatore_id', userData.user.id)
        .eq('lega_id', legaId)
        .maybeSingle();
      
      if (membershipError || !membership) {
        throw new Error('Non sei membro di questa lega privata');
      }
      
      // Se l'utente è membro, ottieni la classifica
      const { data, error } = await supabase
        .from('vista_classifica_leghe')
        .select('*')
        .eq('lega_id', legaId)
        .order('posizione', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      return { giocatori: data as ClassificaLega[], error: null };
    }
  } catch (error) {
    console.error('Errore nel recupero dei giocatori della lega:', error);
    return { giocatori: [], error };
  }
};

export const rigeneraLinkInvito = async (legaId: string) => {
  try {
    // Verifica che l'utente sia admin della lega
    const { isAdmin, error: adminError } = await isLegaAdmin(legaId);
    
    if (!isAdmin || adminError) {
      throw new Error('Non hai i permessi per rigenerare il link di invito per questa lega');
    }
    
    // Genera un nuovo codice di invito
    const nuovoCodice = generateRandomCode(8);
    
    // Aggiorna il codice invito della lega
    // Il trigger aggiorna_ultimo_invito_trigger si occuperà di aggiornare ultimo_invito
    const { data, error } = await supabase
      .from('leghe')
      .update({
        codice_invito: nuovoCodice,
        ultimo_invito: new Date().toISOString() // Aggiorniamo esplicitamente anche qui per sicurezza
      })
      .eq('id', legaId)
      .select('codice_invito, ultimo_invito')
      .single();
    
    if (error) {
      throw error;
    }
    
    console.log('Link invito rigenerato con successo:', data);
    
    return { 
      success: true, 
      codiceInvito: data.codice_invito,
      ultimoInvito: data.ultimo_invito,
      error: null 
    };
  } catch (error) {
    console.error('Errore nella rigenerazione del link di invito:', error);
    return { 
      success: false, 
      codiceInvito: null,
      ultimoInvito: null,
      error 
    };
  }
};

// Funzione di utilità per generare un codice casuale
const generateRandomCode = (length: number): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Funzione per ottenere i dettagli di una lega dal codice di invito
export const getLegaByInviteCode = async (codiceInvito: string) => {
  try {
    console.log('[getLegaByInviteCode] Inizio ricerca lega con codice:', codiceInvito);
    
    if (!codiceInvito) {
      console.log('[getLegaByInviteCode] Codice mancante');
      return { lega: null, error: new Error('Codice invito non valido o mancante') };
    }
    
    // Chiamata diretta alla funzione RPC che bypasserà RLS
    // Questa funzione deve essere creata nel database Supabase con SECURITY DEFINER
    console.log('[getLegaByInviteCode] Chiamata RPC per cercaLegaPerCodice con codice:', codiceInvito);
    
    const { data, error } = await supabase.rpc('cerca_lega_per_codice', {
      p_codice_invito: codiceInvito
    });
    
    console.log('[getLegaByInviteCode] Risposta dalla RPC:', { data, error });
    
    if (error) {
      console.error('[getLegaByInviteCode] Errore nella chiamata RPC:', error);
      return { lega: null, error };
    }
    
    if (!data) {
      console.log('[getLegaByInviteCode] Nessuna lega trovata con questo codice');
      return { lega: null, error: new Error('Codice invito non valido o lega non trovata') };
    }
    
    // Verifica se la lega non è attiva
    if (data && !data.attiva) {
      console.log('[getLegaByInviteCode] Lega trovata ma non attiva');
      return { lega: null, error: new Error('La lega associata a questo codice non è più attiva') };
    }

    console.log('[getLegaByInviteCode] Dati lega trovati:', data);
    
    // Verifica se il link di invito è scaduto
    const isLinkScaduto = verificaScadenzaLink(data.ultimo_invito);
    console.log('[getLegaByInviteCode] Stato scadenza link:', { 
      ultimo_invito: data.ultimo_invito, 
      scaduto: isLinkScaduto 
    });
    
    // Costruisci l'oggetto lega completo con i dati già forniti dalla RPC
    // Nota: la funzione RPC dovrebbe restituire già numero_partecipanti e profiles
    const legaCompleta = { 
      ...data,
      numero_partecipanti: data.numero_partecipanti || 0,
      link_scaduto: isLinkScaduto
    };
    
    console.log('[getLegaByInviteCode] Oggetto lega completo restituito:', legaCompleta);
    
    // Ritorna la lega
    return { 
      lega: legaCompleta as Lega, 
      error: null 
    };
  } catch (error) {
    console.error('[getLegaByInviteCode] Errore generale nella funzione:', error);
    return { lega: null, error };
  }
};

// Funzione utility per verificare se un link di invito è scaduto
export const verificaScadenzaLink = (ultimoInvito: string | null | undefined) => {
  if (!ultimoInvito) return true;
  
  const dataUltimoInvito = new Date(ultimoInvito);
  const now = new Date();
  const diffInHours = (now.getTime() - dataUltimoInvito.getTime()) / (1000 * 60 * 60);
  
  return diffInHours > 12; // Il link scade dopo 12 ore
};

// Funzione diagnostica per ottenere tutte le leghe e verificare i codici di invito
export const verificaCodiciInvito = async () => {
  try {
    const { data, error } = await supabase
      .from('leghe')
      .select('id, nome, codice_invito, attiva')
      .order('nome');
    
    console.log('[verificaCodiciInvito] Tutte le leghe:', data);
    
    return { leghe: data || [], error };
  } catch (error) {
    console.error('[verificaCodiciInvito] Errore:', error);
    return { leghe: [], error };
  }
};

// Funzione diagnostica per verificare se una lega con un dato codice esiste
export const verificaEsistenzaCodiceInvito = async (codice: string) => {
  try {
    console.log('[verificaEsistenzaCodiceInvito] Verifica codice:', codice);
    
    // Prima verifica con eq
    const { data: dataEq, error: errorEq } = await supabase
      .from('leghe')
      .select('id, nome, codice_invito, attiva')
      .eq('codice_invito', codice)
      .limit(1);
    
    console.log('[verificaEsistenzaCodiceInvito] Risultato con eq:', { dataEq, errorEq });
    
    // Verifica con ilike per vedere se ci sono problemi di case
    const { data: dataIlike, error: errorIlike } = await supabase
      .from('leghe')
      .select('id, nome, codice_invito, attiva')
      .ilike('codice_invito', codice)
      .limit(1);
    
    console.log('[verificaEsistenzaCodiceInvito] Risultato con ilike:', { dataIlike, errorIlike });
    
    // Cerca tutte le leghe e filtra manualmente per diagnostica
    // Nota: questa parte è intenzionalmente senza filtri di autorizzazione
    // perché vogliamo diagnosticare tutti i problemi possibili
    const { data: allLeghe } = await supabase
      .from('leghe')
      .select('id, nome, codice_invito, attiva')
      .order('nome');
      
    const matchManuale = allLeghe?.filter(l => 
      l.codice_invito && 
      (l.codice_invito.toLowerCase() === codice.toLowerCase())
    );
    
    console.log('[verificaEsistenzaCodiceInvito] Filtro manuale:', matchManuale);
    
    // Aggiungiamo informazioni di debug aggiuntive
    let debugInfo = null;
    if (errorEq || errorIlike) {
      debugInfo = {
        errorEq: errorEq?.message || null,
        errorIlike: errorIlike?.message || null,
        statusEq: errorEq?.code || null,
        statusIlike: errorIlike?.code || null
      };
    }
    
    return { 
      match: {
        eq: dataEq?.length ? dataEq[0] : null,
        ilike: dataIlike?.length ? dataIlike[0] : null,
        manuale: matchManuale?.length ? matchManuale[0] : null
      },
      debug: debugInfo,
      error: errorEq || errorIlike
    };
  } catch (error) {
    console.error('[verificaEsistenzaCodiceInvito] Errore:', error);
    return { 
      match: { eq: null, ilike: null, manuale: null }, 
      debug: { error: error instanceof Error ? error.message : String(error) },
      error 
    };
  }
};

export const ricalcolaPunteggiLega = async (legaId: string) => {
  try {
    console.log('Avvio ricalcolo punteggi per la lega:', legaId);
    
    // Verifica che l'utente sia admin della lega
    const { isAdmin: isAdminCheck, error: adminError } = await isLegaAdmin(legaId);
    if (!isAdminCheck || adminError) {
      console.error('Solo gli admin possono ricalcolare i punteggi della lega');
      return { success: false, error: 'Permessi insufficienti' };
    }
    
    // Chiama la funzione RPC del database per ricalcolare i punteggi
    const { error } = await supabase.rpc('ricalcola_punteggi_lega', {
      p_lega_id: legaId
    });
    
    if (error) {
      console.error('Errore durante il ricalcolo dei punteggi:', error);
      return { success: false, error: error.message };
    }
    
    console.log('Ricalcolo punteggi completato con successo');
    return { success: true, error: null };
  } catch (error) {
    console.error('Errore durante il ricalcolo dei punteggi:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Errore sconosciuto' };
  }
};

// Funzione per recuperare i pronostici di un giocatore in una lega specifica
export const getPronosticiWithDetailsInLega = async (userId: string, legaId: string) => {
  try {
    console.log('Recupero pronostici con dettagli per utente:', userId, 'in lega:', legaId);
    
    // Utilizziamo una funzione RPC per ottenere la data di ingresso del giocatore
    // in modo da bypassare le RLS policy
    const { data: dataIngresso, error: dataIngressoError } = await supabase.rpc('get_data_ingresso_giocatore', {
      p_giocatore_id: userId,
      p_lega_id: legaId
    });
    
    if (dataIngressoError) {
      console.error('Errore durante il recupero della data di ingresso nella lega:', dataIngressoError);
      return { turniConPronostici: [], error: dataIngressoError };
    }
    
    if (!dataIngresso || !dataIngresso.data_ingresso) {
      console.error('Data di ingresso non trovata. Il giocatore potrebbe non essere membro della lega.');
      return { turniConPronostici: [], error: new Error('Giocatore non membro della lega') };
    }
    
    const dataIngressoStr = dataIngresso.data_ingresso;
    
    // Recuperiamo i pronostici con i dettagli delle partite
    const { data, error } = await supabase
      .from('pronostici')
      .select(`
        *,
        partita:partita_id(
          id,
          data,
          risultato_casa,
          risultato_ospite,
          campionato,
          squadra_casa:squadra_casa_id(id, nome, logo_url),
          squadra_ospite:squadra_ospite_id(id, nome, logo_url),
          turno:turno_id(id, descrizione, data_limite)
        )
      `)
      .eq('user_id', userId)
      .gte('partita.data', dataIngressoStr); // Filtra solo le partite dopo la data di ingresso
    
    if (error) {
      console.error('Errore durante il recupero dei pronostici:', error);
      return { pronosticiConDettagli: [], error };
    }
    
    // Assicuriamoci che il campo campionato sia sempre definito
    const pronosticiConCampionato = data?.map(pronostico => {
      // Verifica che l'oggetto partita esista prima di accedere alle sue proprietà
      if (!pronostico.partita) {
        console.warn('Pronostico senza partita valida trovato:', pronostico.id);
        return null; // Escluderemo questo pronostico dai risultati
      }
      
      return {
        ...pronostico,
        partita: {
          ...pronostico.partita,
          campionato: pronostico.partita.campionato || 'Elite Maschile'
        }
      };
    }).filter(Boolean); // Rimuove gli elementi null
    
    // Organizziamo i pronostici per turno
    const pronosticiPerTurno: Record<string, any[]> = {};
    
    pronosticiConCampionato?.forEach(pronostico => {
      // Verifica che l'oggetto partita e turno esistano prima di accedere alle proprietà
      if (!pronostico.partita || !pronostico.partita.turno) {
        console.warn('Pronostico con struttura incompleta trovato:', pronostico.id);
        return; // Salta questo pronostico
      }
      
      const turnoId = pronostico.partita.turno.id;
      if (!pronosticiPerTurno[turnoId]) {
        pronosticiPerTurno[turnoId] = [];
      }
      pronosticiPerTurno[turnoId].push(pronostico);
    });
    
    // Se non ci sono pronostici validi, restituisci un array vuoto
    if (Object.keys(pronosticiPerTurno).length === 0) {
      return { turniConPronostici: [], error: null };
    }
    
    // Convertiamo l'oggetto in un array ordinato per data_limite del turno (decrescente)
    const turniConPronostici = Object.entries(pronosticiPerTurno).map(([, pronostici]) => {
      const turno = pronostici[0].partita.turno;
      return {
        turno,
        pronostici
      };
    }).sort((a, b) => {
      const dataA = new Date(a.turno.data_limite).getTime();
      const dataB = new Date(b.turno.data_limite).getTime();
      return dataB - dataA; // Ordine decrescente
    });
    
    return { turniConPronostici, error: null };
  } catch (error) {
    console.error('Errore durante l\'elaborazione dei pronostici:', error);
    return { turniConPronostici: [], error };
  }
};

export const getTopPerformers = async () => {
  const { data, error } = await supabase
    .from('top_performers')
    .select('*')
    .order('turno', { ascending: false })
    .order('punti_totali', { ascending: false });
  
  if (error) {
    console.error('Errore nel recupero dei top performers:', error);
  } else {
    console.log('Top performers recuperati dal database:', data);
  }
  
  return { topPerformers: data || [], error };
};

export default supabase;