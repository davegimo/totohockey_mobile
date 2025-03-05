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
        
        // Inizializza i pronostici con i valori esistenti o con 0-0
        if (partiteConPronostici.length > 0) {
          const initialPronostici: Record<string, { casa: number, ospite: number }> = {};
          
          partiteConPronostici.forEach(partita => {
            initialPronostici[partita.id] = {
              casa: partita.pronostico?.pronostico_casa || 0,
              ospite: partita.pronostico?.pronostico_ospite || 0
            };
          });
          
          setPronostici(initialPronostici);
        }
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

  const handlePronosticoChange = (partitaId: string, tipo: 'casa' | 'ospite', valore: number) => {
    console.log(`Cambio pronostico per partita ${partitaId}, tipo: ${tipo}, valore: ${valore}`);
    
    setPronostici(prev => {
      // Assicuriamoci che esista un pronostico per questa partita
      const currentPronostico = prev[partitaId] || { casa: 0, ospite: 0 };
      
      const updatedPronostici = {
        ...prev,
        [partitaId]: {
          ...currentPronostico,
          [tipo]: valore
        }
      };
      
      console.log('Pronostici aggiornati:', updatedPronostici);
      return updatedPronostici;
    });
  };

  const salvaPronostico = async (partitaId: string) => {
    if (!user) return;
    
    try {
      setSalvando(true);
      const pronostico = pronostici[partitaId];
      
      console.log('Tentativo di salvare pronostico:', pronostico, 'per partita:', partitaId);
      
      if (!pronostico) {
        console.log('Pronostico non trovato in state, inizializzo a 0-0');
        // Se non c'è un pronostico nello state, inizializzalo a 0-0
        const defaultPronostico = { casa: 0, ospite: 0 };
        
        const result = await savePronostico({
          user_id: user.id,
          partita_id: partitaId,
          pronostico_casa: defaultPronostico.casa,
          pronostico_ospite: defaultPronostico.ospite
        });
        
        if (result.error) {
          throw result.error;
        }
        
        setSuccessMessage('Pronostico salvato con successo!');
        setTimeout(() => setSuccessMessage(null), 3000);
        return;
      }
      
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
      console.error('Errore nel salvare il pronostico:', err);
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
                          value={pronostici[partita.id]?.casa ?? 0}
                          onChange={(e) => handlePronosticoChange(partita.id, 'casa', parseInt(e.target.value) || 0)}
                          className="pronostico-input-dashboard"
                          disabled={partita.risultato_casa !== null && partita.risultato_ospite !== null || isPronosticoScaduto()}
                        />
                        <span className="pronostico-separator-dashboard">-</span>
                        <input
                          type="number"
                          min="0"
                          value={pronostici[partita.id]?.ospite ?? 0}
                          onChange={(e) => handlePronosticoChange(partita.id, 'ospite', parseInt(e.target.value) || 0)}
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