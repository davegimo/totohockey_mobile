import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { getPronosticiWithDetails, getGiocatoreById } from '../services/supabase';
import { ProfileData } from '../services/supabase';
import '../styles/GiocatorePage.css';

type PronosticoConDettagli = {
  id: string;
  user_id: string;
  partita_id: string;
  pronostico_casa: number;
  pronostico_ospite: number;
  punti: number | null;
  partita: {
    id: string;
    data: string;
    risultato_casa: number | null;
    risultato_ospite: number | null;
    campionato: string;
    squadra_casa: {
      id: number;
      nome: string;
      logo_url: string | null;
    };
    squadra_ospite: {
      id: number;
      nome: string;
      logo_url: string | null;
    };
    turno: {
      id: string;
      descrizione: string;
      data_limite: string;
    };
  };
};

type TurnoConPronostici = {
  turno: {
    id: string;
    descrizione: string;
    data_limite: string;
  };
  pronostici: PronosticoConDettagli[];
};

const GiocatorePage = () => {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<ProfileData | null>(null);
  const [turniConPronostici, setTurniConPronostici] = useState<TurnoConPronostici[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Recupera i dati dell'utente dalla vista vista_giocatori
        const { user, error: userError } = await getGiocatoreById(id);
        
        if (userError) {
          throw new Error('Errore durante il recupero dei dati dell\'utente');
        }
        
        if (!user) {
          throw new Error('Utente non trovato');
        }
        
        setUser(user);
        
        // Recupera i pronostici dell'utente
        const { turniConPronostici, error: pronosticiError } = await getPronosticiWithDetails(id);
        
        if (pronosticiError) {
          throw new Error('Errore durante il recupero dei pronostici');
        }
        
        console.log('Pronostici recuperati:', turniConPronostici);
        
        // Filtra i pronostici per mostrare solo quelli con risultati definitivi
        const turniConPronosticiFiltrati = turniConPronostici?.map(turno => {
          return {
            ...turno,
            pronostici: turno.pronostici.filter(pronostico => 
              pronostico.partita.risultato_casa !== null && 
              pronostico.partita.risultato_ospite !== null
            )
          };
        }).filter(turno => turno.pronostici.length > 0) || [];
        
        // Verifica i valori del campionato
        if (turniConPronosticiFiltrati && turniConPronosticiFiltrati.length > 0) {
          turniConPronosticiFiltrati.forEach(turno => {
            turno.pronostici.forEach(pronostico => {
              console.log('Campionato partita:', pronostico.partita.campionato);
            });
          });
        }
        
        setTurniConPronostici(turniConPronosticiFiltrati);
        setLoading(false);
      } catch (err: any) {
        console.error('Errore:', err);
        setError(err.message || 'Si è verificato un errore. Riprova più tardi.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  const formatData = (dataString: string) => {
    const data = new Date(dataString);
    return data.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const renderPuntiIndicator = (punti: number | null) => {
    if (punti === null) {
      return <div className="punti-pending">In attesa</div>;
    } else if (punti === 0) {
      return <div className="punti-zero">❌</div>;
    } else if (punti === 1) {
      return <div className="punti-uno">✓</div>;
    } else if (punti === 3) {
      return <div className="punti-tre">✓✓✓</div>;
    }
    return null;
  };

  return (
    <Layout>
      <div className="giocatore-page">
        {error && <div className="error">{error}</div>}
        
        {loading ? (
          <div className="loading">Caricamento dati...</div>
        ) : (
          <>
            <div className="giocatore-header">
              <h1>{user?.nome} {user?.cognome}</h1>
              <div className="giocatore-stats">
                <div className="giocatore-punteggio">
                  <span className="punteggio-label">Punti:</span>
                  <span className="punteggio-value">{user?.punteggio}</span>
                </div>
                <div className="giocatore-risultati">
                  <span className="risultati-label">Risultati:</span>
                  <span className="risultati-value">{user?.risultati_esatti || 0}</span>
                </div>
                <div className="giocatore-esiti">
                  <span className="esiti-label">Esiti:</span>
                  <span className="esiti-value">{user?.esiti_presi || 0}</span>
                </div>
              </div>
            </div>
            
            {turniConPronostici.length === 0 ? (
              <div className="no-pronostici">
                <p>Nessun pronostico disponibile</p>
              </div>
            ) : (
              <div className="turni-container">
                {turniConPronostici.map((turnoData) => (
                  <div key={turnoData.turno.id} className="turno-card">
                    <div className="turno-header">
                      <h2>{turnoData.turno.descrizione}</h2>
                      <div className="turno-data">
                        Scadenza: {formatData(turnoData.turno.data_limite)}
                      </div>
                    </div>
                    
                    <div className="pronostici-list">
                      {turnoData.pronostici.map((pronostico) => (
                        <div 
                          key={pronostico.id} 
                          className={`pronostico-card ${
                            pronostico.partita.campionato === 'Elite Femminile' 
                              ? 'pronostico-card-elite-femminile' 
                              : 'pronostico-card-elite-maschile'
                          }`}
                        >
                          <div className="partita-info">
                            <div className={`partita-campionato ${
                              pronostico.partita.campionato === 'Elite Femminile' 
                                ? 'campionato-femminile' 
                                : 'campionato-maschile'
                            }`}>
                              {pronostico.partita.campionato === 'Elite Femminile' ? 'F' : 'M'}
                            </div>
                            <div className="partita-teams">
                              <div className="team team-casa">
                                <div className="team-name">{pronostico.partita.squadra_casa.nome}</div>
                                {pronostico.partita.squadra_casa.logo_url && (
                                  <img
                                    src={pronostico.partita.squadra_casa.logo_url}
                                    alt={pronostico.partita.squadra_casa.nome}
                                    className="team-logo"
                                  />
                                )}
                              </div>
                              
                              <div className="risultato-container">
                                <div className="risultato-finale">
                                  {pronostico.partita.risultato_casa !== null && pronostico.partita.risultato_ospite !== null ? (
                                    <>
                                      <span className="risultato">{pronostico.partita.risultato_casa}</span>
                                      <span className="risultato">:</span>
                                      <span className="risultato">{pronostico.partita.risultato_ospite}</span>
                                    </>
                                  ) : (
                                    <span className="risultato-pending">In attesa</span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="team team-ospite">
                                {pronostico.partita.squadra_ospite.logo_url && (
                                  <img
                                    src={pronostico.partita.squadra_ospite.logo_url}
                                    alt={pronostico.partita.squadra_ospite.nome}
                                    className="team-logo"
                                  />
                                )}
                                <div className="team-name">{pronostico.partita.squadra_ospite.nome}</div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="punti-container">
                            {renderPuntiIndicator(pronostico.punti)}
                            <div className="pronostico-value">
                              {pronostico.pronostico_casa} : {pronostico.pronostico_ospite}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default GiocatorePage; 