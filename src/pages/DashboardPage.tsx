import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../services/supabase';
import { Partita, Pronostico, getPartite, savePronostico, User, getUltimoTurno, Turno } from '../services/supabase';
import Layout from '../components/Layout';
import { PartitaWithPronostico } from '../types';
import '../styles/DashboardPage.css';

const DashboardPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [partite, setPartite] = useState<PartitaWithPronostico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pronostici, setPronostici] = useState<Record<string, { casa: number, ospite: number }>>({});
  const [inputValues, setInputValues] = useState<Record<string, { casa: string, ospite: string }>>({});
  const [salvando, setSalvando] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [turnoAttuale, setTurnoAttuale] = useState<Turno | null>(null);
  const [countdown, setCountdown] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      
      if (error || !data.user) {
        navigate('/login');
        return;
      }
      
      // Ottieni i dati dell'utente dal profilo
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      if (profileData) {
        setUser({
          id: data.user.id,
          email: data.user.email || '',
          nome: profileData.nome || '',
          cognome: profileData.cognome || '',
          punteggio: profileData.punteggio || 0
        });
      } else if (profileError) {
        console.error('Errore nel recupero del profilo:', profileError);
        // Crea un utente di base anche se il profilo non esiste
        setUser({
          id: data.user.id,
          email: data.user.email || '',
          nome: 'Utente',
          cognome: 'Temporaneo',
          punteggio: 0
        });
        
        // Prova a creare un profilo base
        try {
          await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: data.user.email,
              nome: 'Utente',
              cognome: 'Temporaneo',
              punteggio: 0
            });
        } catch (insertError) {
          console.error('Impossibile creare il profilo:', insertError);
        }
      }
    };
    
    checkUser();
  }, [navigate]);

  useEffect(() => {
    const fetchPartite = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Recupera il turno più recente
        const { turno, error: turnoError } = await getUltimoTurno();
        
        if (turnoError) {
          throw turnoError;
        }
        
        if (!turno) {
          setPartite([]);
          return;
        }
        
        setTurnoAttuale(turno);
        
        // Ottieni le partite del turno più recente
        const { partite: partiteData, error: partiteError } = await getPartite(turno.id);
        
        if (partiteError) {
          throw partiteError;
        }
        
        console.log('Partite recuperate:', partiteData);
        
        // Verifica i valori del campionato
        if (partiteData && partiteData.length > 0) {
          partiteData.forEach(partita => {
            console.log('Campionato partita dashboard:', partita.campionato);
          });
        }
        
        // Ottieni i pronostici dell'utente
        const { data: pronosticiData, error: pronosticiError } = await supabase
          .from('pronostici')
          .select('*')
          .eq('user_id', user.id);
        
        if (pronosticiError) throw pronosticiError;
        
        // Combina partite e pronostici
        const partiteConPronostici = partiteData.map((partita: Partita) => {
          const pronostico = pronosticiData.find((p: Pronostico) => p.partita_id === partita.id);
          return {
            ...partita,
            pronostico
          };
        });
        
        setPartite(partiteConPronostici);
        
        // Inizializza lo stato dei pronostici
        const pronosticiIniziali: Record<string, { casa: number, ospite: number }> = {};
        // Inizializza anche i valori di input
        const inputValuesIniziali: Record<string, { casa: string, ospite: string }> = {};
        
        pronosticiData.forEach((p: Pronostico) => {
          pronosticiIniziali[p.partita_id] = {
            casa: p.pronostico_casa,
            ospite: p.pronostico_ospite
          };
          
          inputValuesIniziali[p.partita_id] = {
            casa: p.pronostico_casa.toString(),
            ospite: p.pronostico_ospite.toString()
          };
        });
        
        setPronostici(pronosticiIniziali);
        setInputValues(inputValuesIniziali);
      } catch (err: any) {
        setError(err.message || 'Errore nel caricamento delle partite');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPartite();
  }, [user]);

  // Aggiorna il countdown ogni secondo
  useEffect(() => {
    if (!turnoAttuale) return;
    
    const updateCountdown = () => {
      const now = new Date();
      const dataLimite = new Date(turnoAttuale.data_limite);
      
      // Se la data limite è già passata
      if (dataLimite <= now) {
        setCountdown('Tempo scaduto!');
        return;
      }
      
      const diff = dataLimite.getTime() - now.getTime();
      
      // Calcola giorni, ore, minuti e secondi
      const giorni = Math.floor(diff / (1000 * 60 * 60 * 24));
      const ore = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minuti = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secondi = Math.floor((diff % (1000 * 60)) / 1000);
      
      setCountdown(`${giorni}g ${ore}h ${minuti}m ${secondi}s`);
    };
    
    // Aggiorna subito e poi ogni secondo
    updateCountdown();
    const intervalId = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(intervalId);
  }, [turnoAttuale]);

  // Funzione per verificare se il tempo per i pronostici è scaduto
  const isPronosticoScaduto = () => {
    if (!turnoAttuale) return false;
    
    const now = new Date();
    const dataLimite = new Date(turnoAttuale.data_limite);
    
    return dataLimite <= now;
  };

  const handlePronosticoChange = (partitaId: string, tipo: 'casa' | 'ospite', valore: string) => {
    // Verifichiamo che il valore contenga solo cifre
    if (valore !== '' && !/^\d+$/.test(valore)) {
      return; // Ignoriamo input non numerici
    }
    
    // Aggiorniamo i valori di input
    setInputValues(prev => ({
      ...prev,
      [partitaId]: {
        ...prev[partitaId] || { casa: '0', ospite: '0' },
        [tipo]: valore
      }
    }));
    
    // Se il valore è una stringa vuota, non aggiorniamo i pronostici
    if (valore === '') return;
    
    // Convertiamo il valore in numero
    const numeroValore = parseInt(valore);
    
    // Se è un numero valido e positivo, aggiorniamo i pronostici
    if (!isNaN(numeroValore) && numeroValore >= 0) {
      setPronostici(prev => {
        // Otteniamo il pronostico corrente o inizializziamo con valori di default
        const pronosticoCorrente = prev[partitaId] || { 
          // Se esiste già un pronostico per questa partita nelle partite caricate, lo usiamo
          casa: partite.find(p => p.id === partitaId)?.pronostico?.pronostico_casa || 0, 
          ospite: partite.find(p => p.id === partitaId)?.pronostico?.pronostico_ospite || 0 
        };
        
        return {
          ...prev,
          [partitaId]: {
            ...pronosticoCorrente, // Manteniamo i valori esistenti
            [tipo]: numeroValore   // Aggiorniamo solo il campo specifico
          }
        };
      });
    }
  };

  const salvaPronostico = async (partitaId: string) => {
    if (!user) return;
    
    try {
      setSalvando(true);
      const pronostico = pronostici[partitaId];
      
      if (!pronostico) return;
      
      const result = await savePronostico({
        user_id: user.id,
        partita_id: partitaId,
        pronostico_casa: pronostico.casa,
        pronostico_ospite: pronostico.ospite
      });
      
      if (result.error) {
        throw result.error;
      }
      
      setSuccessMessage('Pronostico salvato con successo!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Errore nel salvare il pronostico');
    } finally {
      setSalvando(false);
    }
  };

  const formatData = (dataString: string) => {
    const data = new Date(dataString);
    return data.toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDataLimite = (dataString: string) => {
    const data = new Date(dataString);
    return data.toLocaleDateString('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading">Caricamento in corso...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="dashboard-page">
        <h1>Prossime Partite</h1>
        
        {error && <div className="error">{error}</div>}
        {successMessage && <div className="success">{successMessage}</div>}
        
        {/* Mostra il countdown solo se il tempo non è scaduto */}
        {turnoAttuale && !isPronosticoScaduto() && (
          <div className="turno-countdown">
            <p className="countdown-message">
              Hai tempo fino a {formatDataLimite(turnoAttuale.data_limite)} per inserire il tuo pronostico!
            </p>
            <div className="countdown-timer">{countdown}</div>
          </div>
        )}
        
        {partite.length === 0 ? (
          <div className="no-partite">
            <p>Non ci sono partite in programma al momento.</p>
          </div>
        ) : (
          <div className="partite-list-dashboard">
            {partite.map((partita) => (
              <div 
                key={partita.id} 
                className={`partita-card-dashboard ${
                  partita.campionato === 'Elite Femminile' 
                    ? 'partita-card-elite-femminile' 
                    : 'partita-card-elite-maschile'
                }`}
              >
                <div className="partita-header-dashboard">
                  <div className="partita-data-dashboard">{formatData(partita.data)}</div>
                  <div className={`partita-campionato ${
                    partita.campionato === 'Elite Femminile' 
                      ? 'campionato-femminile' 
                      : 'campionato-maschile'
                  }`}>
                    {partita.campionato || 'Elite Maschile'}
                  </div>
                </div>
                <div className="partita-teams-dashboard">
                  <div className="team-dashboard team-casa-dashboard">
                    {partita.squadra_casa?.nome || 'Squadra sconosciuta'}
                    {partita.squadra_casa?.logo_url && (
                      <img 
                        src={partita.squadra_casa.logo_url} 
                        alt={`Logo ${partita.squadra_casa.nome}`} 
                        className="team-logo-dashboard"
                      />
                    )}
                  </div>
                  <div className="vs-dashboard">VS</div>
                  <div className="team-dashboard team-ospite-dashboard">
                    {partita.squadra_ospite?.nome || 'Squadra sconosciuta'}
                    {partita.squadra_ospite?.logo_url && (
                      <img 
                        src={partita.squadra_ospite.logo_url} 
                        alt={`Logo ${partita.squadra_ospite.nome}`} 
                        className="team-logo-dashboard"
                      />
                    )}
                  </div>
                </div>
                
                {/* Mostra il risultato effettivo se disponibile */}
                {(partita.risultato_casa !== null && partita.risultato_ospite !== null) && (
                  <div className="risultato-container-dashboard">
                    <h3>Risultato finale</h3>
                    <div className="risultato-finale-dashboard">
                      <span className="risultato-valore-dashboard">{partita.risultato_casa}</span>
                      <span className="risultato-separator-dashboard">-</span>
                      <span className="risultato-valore-dashboard">{partita.risultato_ospite}</span>
                    </div>
                  </div>
                )}
                
                <div className="pronostico-container-dashboard">
                  <h3>Il tuo pronostico</h3>
                  
                  {/* Se la partita ha un risultato ma non c'è un pronostico */}
                  {(partita.risultato_casa !== null && partita.risultato_ospite !== null && !partita.pronostico) || 
                   (isPronosticoScaduto() && !partita.pronostico) ? (
                    <div className="pronostico-non-inserito">
                      <p>Pronostico non inserito</p>
                    </div>
                  ) : (
                    <>
                      <div className="pronostico-inputs-dashboard">
                        <input
                          type="number"
                          min="0"
                          pattern="[0-9]*"
                          inputMode="numeric"
                          value={inputValues[partita.id]?.casa ?? pronostici[partita.id]?.casa ?? '0'}
                          onChange={(e) => handlePronosticoChange(partita.id, 'casa', e.target.value)}
                          onFocus={(e) => {
                            // Quando l'input riceve il focus e il valore è 0, selezioniamo tutto il testo
                            if (e.target.value === '0') {
                              e.target.select();
                            }
                          }}
                          className="pronostico-input-dashboard"
                          disabled={partita.risultato_casa !== null && partita.risultato_ospite !== null || isPronosticoScaduto()}
                        />
                        <span className="pronostico-separator-dashboard">-</span>
                        <input
                          type="number"
                          min="0"
                          pattern="[0-9]*"
                          inputMode="numeric"
                          value={inputValues[partita.id]?.ospite ?? pronostici[partita.id]?.ospite ?? '0'}
                          onChange={(e) => handlePronosticoChange(partita.id, 'ospite', e.target.value)}
                          onFocus={(e) => {
                            // Quando l'input riceve il focus e il valore è 0, selezioniamo tutto il testo
                            if (e.target.value === '0') {
                              e.target.select();
                            }
                          }}
                          className="pronostico-input-dashboard"
                          disabled={partita.risultato_casa !== null && partita.risultato_ospite !== null || isPronosticoScaduto()}
                        />
                      </div>
                      
                      {/* Mostra il bottone solo se non c'è un risultato e il tempo non è scaduto */}
                      {(partita.risultato_casa === null || partita.risultato_ospite === null) && !isPronosticoScaduto() && (
                        <button 
                          onClick={() => salvaPronostico(partita.id)} 
                          className="salva-btn"
                          disabled={salvando}
                        >
                          {salvando ? 'Salvando...' : 'Salva pronostico'}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DashboardPage;