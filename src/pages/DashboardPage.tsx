import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import supabase from '../services/supabase';
import { Partita, Pronostico, getPartite, savePronostico, User, getUltimoTurno, Turno } from '../services/supabase';
import Layout from '../components/Layout';
import { PartitaWithPronostico } from '../types';
import '../styles/DashboardPage.css';

// Componente Toast per mostrare messaggi
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [onClose]);
  
  return (
    <div className={`toast-message ${type}`}>
      <div className="toast-content">{message}</div>
    </div>
  );
};

// Componente Modal per l'inserimento dei pronostici
const PronosticoModal = ({ 
  isOpen, 
  onClose, 
  partita, 
  pronosticoAttuale, 
  onSave, 
  salvando 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  partita: PartitaWithPronostico, 
  pronosticoAttuale: { casa: string, ospite: string } | null,
  onSave: (pronosticoCasa: number, pronosticoOspite: number) => void,
  salvando: boolean
}) => {
  const [pronosticoCasa, setPronosticoCasa] = useState(pronosticoAttuale?.casa || '');
  const [pronosticoOspite, setPronosticoOspite] = useState(pronosticoAttuale?.ospite || '');
  const [initialLoad, setInitialLoad] = useState(true);
  
  useEffect(() => {
    // Aggiorna i valori solo la prima volta che si apre il modal
    if (isOpen && pronosticoAttuale && initialLoad) {
      setPronosticoCasa(pronosticoAttuale.casa);
      setPronosticoOspite(pronosticoAttuale.ospite);
      setInitialLoad(false);
    }
    
    // Resetta lo stato quando si chiude il modal
    if (!isOpen) {
      setInitialLoad(true);
    }
  }, [isOpen, pronosticoAttuale, initialLoad]);
  
  if (!isOpen) return null;
  
  const handleSave = () => {
    const casaNum = parseInt(pronosticoCasa, 10);
    const ospiteNum = parseInt(pronosticoOspite, 10);
    
    if (isNaN(casaNum) || isNaN(ospiteNum)) {
      return; // Non salvare se i valori non sono numerici
    }
    
    onSave(casaNum, ospiteNum);
  };
  
  const handleChange = (value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    // Verifichiamo che il valore contenga solo cifre o sia vuoto
    if (value !== '' && !/^\d+$/.test(value)) {
      return; // Ignoriamo input non numerici
    }
    setter(value);
  };
  
  return (
    <div className="pronostico-modal-overlay">
      <div className="pronostico-modal">
        <button className="pronostico-modal-close" onClick={onClose}>×</button>
        
        <h3 className="pronostico-modal-title">
          {partita.pronostico ? 'Aggiorna Pronostico' : 'Inserisci Pronostico'}
        </h3>
        
        <div className="pronostico-modal-content">
          <div className="pronostico-modal-teams">
            <div className="pronostico-modal-team">
              <div className="pronostico-modal-team-logo">
                {partita.squadra_casa?.logo_url && (
                  <img 
                    src={partita.squadra_casa.logo_url} 
                    alt={`Logo ${partita.squadra_casa.nome}`}
                  />
                )}
              </div>
              <div className="pronostico-modal-team-name">
                {partita.squadra_casa?.nome || 'Squadra casa'}
              </div>
            </div>
            
            <div className="pronostico-modal-score">
              <input
                type="number"
                min="0"
                inputMode="numeric"
                value={pronosticoCasa}
                onChange={(e) => handleChange(e.target.value, setPronosticoCasa)}
                className="pronostico-modal-input"
              />
              <span className="pronostico-modal-score-separator">:</span>
              <input
                type="number"
                min="0"
                inputMode="numeric"
                value={pronosticoOspite}
                onChange={(e) => handleChange(e.target.value, setPronosticoOspite)}
                className="pronostico-modal-input"
              />
            </div>
            
            <div className="pronostico-modal-team">
              <div className="pronostico-modal-team-logo">
                {partita.squadra_ospite?.logo_url && (
                  <img 
                    src={partita.squadra_ospite.logo_url} 
                    alt={`Logo ${partita.squadra_ospite.nome}`}
                  />
                )}
              </div>
              <div className="pronostico-modal-team-name">
                {partita.squadra_ospite?.nome || 'Squadra ospite'}
              </div>
            </div>
          </div>
        </div>
        
        <div className="pronostico-modal-actions">
          <button 
            onClick={handleSave} 
            className="pronostico-modal-save"
            disabled={salvando || pronosticoCasa === '' || pronosticoOspite === ''}
          >
            {salvando ? 'Salvando...' : 'Salva Pronostico'}
          </button>
        </div>
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [partite, setPartite] = useState<PartitaWithPronostico[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvandoPartite, setSalvandoPartite] = useState<Record<string, boolean>>({});
  const [turnoAttuale, setTurnoAttuale] = useState<Turno | null>(null);
  const [countdown, setCountdown] = useState<string>('');
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error', id: number } | null>(null);
  const [modalPartita, setModalPartita] = useState<PartitaWithPronostico | null>(null);
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
      } catch (err: any) {
        console.error('Errore nel caricamento delle partite:', err.message || 'Errore nel caricamento delle partite');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPartite();
  }, [user]);

  // Funzione per convertire una data UTC in CET
  const convertToCET = (dateString: string): Date => {
    const date = new Date(dateString);
    // Creiamo una nuova data che sarà già in CET in base al fuso orario locale
    return new Date(date);
  };

  // Aggiorna il countdown ogni secondo
  useEffect(() => {
    if (!turnoAttuale) return;
    
    const updateCountdown = () => {
      const now = new Date();
      const dataLimite = convertToCET(turnoAttuale.data_limite);
      
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
    const dataLimite = convertToCET(turnoAttuale.data_limite);
    
    return dataLimite <= now;
  };

  // Funzione per mostrare un toast con ID univoco
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type, id: Date.now() });
  };

  // Funzione per aprire il modal di pronostico
  const openPronosticoModal = (partita: PartitaWithPronostico) => {
    setModalPartita(partita);
  };

  // Funzione per chiudere il modal di pronostico
  const closePronosticoModal = () => {
    setModalPartita(null);
  };

  const salvaPronostico = async (partitaId: string, pronosticoCasa: number, pronosticoOspite: number) => {
    if (!user) {
      showToast('Devi essere loggato per salvare un pronostico', 'error');
      return;
    }
    
    // Impostiamo lo stato di salvataggio solo per questa partita
    setSalvandoPartite(prev => ({
      ...prev,
      [partitaId]: true
    }));
    
    try {
      // Salviamo il pronostico
      const { error } = await savePronostico({
        user_id: user.id,
        partita_id: partitaId,
        pronostico_casa: pronosticoCasa,
        pronostico_ospite: pronosticoOspite
      });
      
      if (error) {
        throw error;
      }
      
      // Aggiorniamo la partita nella lista
      setPartite(prev => prev.map(p => {
        if (p.id === partitaId) {
          return {
            ...p,
            pronostico: {
              id: 'temp-id', // ID temporaneo, verrà aggiornato al prossimo caricamento
              user_id: user.id,
              partita_id: partitaId,
              pronostico_casa: pronosticoCasa,
              pronostico_ospite: pronosticoOspite
            }
          };
        }
        return p;
      }));
      
      showToast('Pronostico salvato con successo', 'success');
      
      // Chiudiamo il modal
      closePronosticoModal();
      
    } catch (error) {
      console.error('Errore durante il salvataggio del pronostico:', error);
      showToast('Si è verificato un errore durante il salvataggio del pronostico', 'error');
    } finally {
      // Resettiamo lo stato di salvataggio solo per questa partita
      setSalvandoPartite(prev => ({
        ...prev,
        [partitaId]: false
      }));
    }
  };

  const formatData = (dataString: string) => {
    const data = convertToCET(dataString);
    const giorniAbbreviati: Record<string, string> = {
      'lunedì': 'lun',
      'martedì': 'mar',
      'mercoledì': 'mer',
      'giovedì': 'gio',
      'venerdì': 'ven',
      'sabato': 'sab',
      'domenica': 'dom'
    };
    
    const formatoCompleto = data.toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Sostituiamo il nome del giorno con l'abbreviazione
    const giorno = data.toLocaleDateString('it-IT', { weekday: 'long' });
    const giornoAbbreviato = giorniAbbreviati[giorno] || giorno;
    
    return formatoCompleto.replace(giorno, giornoAbbreviato);
  };

  const formatDataLimite = (dataString: string) => {
    const data = convertToCET(dataString);
    return data.toLocaleDateString('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Funzione per determinare il risultato del pronostico
  const getPronosticoResult = (partita: any) => {
    // Se non c'è un risultato o un pronostico, ritorna null
    if (partita.risultato_casa === null || partita.risultato_ospite === null || !partita.pronostico) {
      return null;
    }
    
    const risultatoCasa = partita.risultato_casa;
    const risultatoOspite = partita.risultato_ospite;
    const pronosticoCasa = partita.pronostico.pronostico_casa;
    const pronosticoOspite = partita.pronostico.pronostico_ospite;
    
    // Punteggio esatto
    if (risultatoCasa === pronosticoCasa && risultatoOspite === pronosticoOspite) {
      return 'exact';
    }
    
    // Risultato corretto (vittoria, pareggio, sconfitta)
    const risultatoMatch = 
      risultatoCasa > risultatoOspite ? 'home' : 
      risultatoCasa < risultatoOspite ? 'away' : 'draw';
    
    const pronosticoMatch = 
      pronosticoCasa > pronosticoOspite ? 'home' : 
      pronosticoCasa < pronosticoOspite ? 'away' : 'draw';
    
    if (risultatoMatch === pronosticoMatch) {
      return 'correct';
    }
    
    // Risultato sbagliato
    return 'wrong';
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
      <div className="dashboard-container">
        {toast && (
          <Toast 
            key={toast.id}
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(null)} 
          />
        )}
        
        <div className="dashboard-page">
          <h1>Prossime Partite</h1>
          
          <div className="dashboard-news-message">
            <strong>Novità!</strong> Abbiamo introdotto le <Link to="/leghe">Leghe Private</Link>! 
            Creane subito una per sfidare i tuoi amici!!
          </div>
          
          {/* Mostra il countdown solo se il tempo non è scaduto */}
          {turnoAttuale && !isPronosticoScaduto() && (
            <div className="turno-countdown">
              <p className="countdown-message">
                Hai tempo fino a {formatDataLimite(turnoAttuale.data_limite)} per inserire i tuoi pronostici!
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
                <div key={partita.id} className="match-dashboard">
                  <div className={`match-header-dashboard ${
                      partita.campionato === 'Elite Femminile' 
                        ? 'header-elite-femminile-dashboard' 
                        : 'header-elite-maschile-dashboard'
                    }`}>
                    <div className={`match-tournament-dashboard ${
                      partita.campionato === 'Elite Femminile' 
                        ? 'elite-femminile-dashboard' 
                        : 'elite-maschile-dashboard'
                    }`}>
                      {partita.campionato || 'Elite Maschile'}
                    </div>
                    
                    {/* Indicatore di risultato del pronostico */}
                    {partita.risultato_casa !== null && partita.risultato_ospite !== null && (
                      <>
                        {!partita.pronostico ? (
                          <div className="result-indicator-dashboard wrong-result">
                            <span className="emoji">❌</span>
                          </div>
                        ) : getPronosticoResult(partita) === 'exact' ? (
                          <div className="result-indicator-dashboard correct-score">
                            <span className="emoji">✓✓✓</span>
                            <span className="points">+3</span>
                          </div>
                        ) : getPronosticoResult(partita) === 'correct' ? (
                          <div className="result-indicator-dashboard correct-result">
                            <span className="emoji">✓</span>
                            <span className="points">+1</span>
                          </div>
                        ) : (
                          <div className="result-indicator-dashboard wrong-result">
                            <span className="emoji">❌</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <div className="match-content-dashboard">
                    <div className="column-dashboard">
                      <div className="team-dashboard">
                        <div className="team-logo-dashboard">
                          {partita.squadra_casa?.logo_url && (
                            <img 
                              src={partita.squadra_casa.logo_url} 
                              alt={`Logo ${partita.squadra_casa.nome}`}
                            />
                          )}
                        </div>
                        <h2 className="team-name-dashboard">{partita.squadra_casa?.nome || 'Squadra sconosciuta'}</h2>
                      </div>
                    </div>
                    <div className="column-dashboard">
                      <div className="match-details-dashboard">
                        <div className="match-date-dashboard">
                          {formatData(partita.data)}
                        </div>
                        
                        {/* Mostra il risultato effettivo se disponibile */}
                        {(partita.risultato_casa !== null && partita.risultato_ospite !== null) ? (
                          <div className="match-score-dashboard">
                            <span className="match-score-number-dashboard">{partita.risultato_casa}</span>
                            <span className="match-score-divider-dashboard">:</span>
                            <span className="match-score-number-dashboard">{partita.risultato_ospite}</span>
                          </div>
                        ) : isPronosticoScaduto() ? (
                          <div className="match-waiting-dashboard">In attesa</div>
                        ) : (
                          <>
                            {/* Se c'è un pronostico, mostralo in modalità non editabile */}
                            {partita.pronostico ? (
                              <div className="match-pronostico-saved-dashboard">
                                <div className="match-pronostico-saved-value-dashboard">
                                  <span>{partita.pronostico.pronostico_casa}</span>
                                  <span className="match-pronostico-saved-separator-dashboard">:</span>
                                  <span>{partita.pronostico.pronostico_ospite}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="match-waiting-dashboard pronostico-non-inserito">Pronostico non inserito</div>
                            )}
                          </>
                        )}
                        
                        {/* Mostra il bottone solo se non c'è un risultato e il tempo non è scaduto */}
                        {(partita.risultato_casa === null && partita.risultato_ospite === null) && !isPronosticoScaduto() && (
                          <button 
                            onClick={() => openPronosticoModal(partita)} 
                            className="match-bet-place-dashboard"
                          >
                            {partita.pronostico ? 'Aggiorna pronostico' : 'Inserisci pronostico'}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="column-dashboard">
                      <div className="team-dashboard">
                        <div className="team-logo-dashboard">
                          {partita.squadra_ospite?.logo_url && (
                            <img 
                              src={partita.squadra_ospite.logo_url} 
                              alt={`Logo ${partita.squadra_ospite.nome}`}
                            />
                          )}
                        </div>
                        <h2 className="team-name-dashboard">{partita.squadra_ospite?.nome || 'Squadra sconosciuta'}</h2>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Modal per l'inserimento/aggiornamento del pronostico */}
          {modalPartita && (
            <PronosticoModal
              isOpen={!!modalPartita}
              onClose={closePronosticoModal}
              partita={modalPartita}
              pronosticoAttuale={modalPartita.pronostico ? {
                casa: modalPartita.pronostico.pronostico_casa.toString(),
                ospite: modalPartita.pronostico.pronostico_ospite.toString()
              } : null}
              onSave={(pronosticoCasa, pronosticoOspite) => 
                salvaPronostico(modalPartita.id, pronosticoCasa, pronosticoOspite)
              }
              salvando={salvandoPartite[modalPartita.id] || false}
            />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage;