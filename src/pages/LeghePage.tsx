import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../services/supabase';
import Layout from '../components/Layout';
import { getClassifica, getLegheUtente, Lega } from '../services/supabase';
import '../styles/LeghePage.css';

// Tipo per gli elementi della classifica
type ClassificaItem = {
  id_giocatore: string;
  nome: string;
  cognome: string;
  punti_totali: number;
  risultati_esatti: number;
  esiti_presi: number;
};

const LeghePage = () => {
  const [leghe, setLeghe] = useState<Lega[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [posizioneUtente, setPosizioneUtente] = useState<number | null>(null);
  const [numGiocatori, setNumGiocatori] = useState<number>(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Ottieni l'utente corrente
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError || !userData.user) {
          navigate('/login');
          return;
        }
        
        setUserId(userData.user.id);
        
        // Ottieni le leghe dell'utente
        const { leghe: userLeghe, error: legheError } = await getLegheUtente();
        
        if (legheError) {
          console.error('Errore nel recupero delle leghe:', legheError);
          throw legheError;
        }
        
        // Ottieni i dati dalla vista_giocatori per la classifica generale
        const { classifica: classificaData, error: classificaError } = await getClassifica();
        
        if (classificaError) {
          console.error('Errore nel recupero della classifica:', classificaError);
          throw classificaError;
        }
        
        const giocatori = classificaData as ClassificaItem[];
        
        // Trova la posizione dell'utente corrente nella classifica
        const userPosition = giocatori.findIndex(g => g.id_giocatore === userData.user.id) + 1;
        setPosizioneUtente(userPosition > 0 ? userPosition : null);
        setNumGiocatori(giocatori.length);
        
        // Crea la lega pubblica con i dati richiesti
        const legaPubblica: Lega = {
          id: 'public',
          nome: 'Totocontest 2025',
          descrizione: 'Lega pubblica per vincere fantastici premi!',
          is_pubblica: true,
          creato_da: 'admin', // Assumiamo che la lega pubblica sia creata dall'admin
          data_creazione: new Date().toISOString(),
          ultima_modifica: new Date().toISOString(),
          attiva: true
        };
        
        // Imposta l'elenco completo delle leghe con la lega pubblica in cima
        setLeghe([legaPubblica, ...userLeghe]);
        
      } catch (err) {
        console.error('Errore nel caricamento delle leghe:', err);
        setError('Si è verificato un errore nel caricamento delle leghe.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [navigate]);
  
  const handleCreaLega = () => {
    // Naviga alla pagina di creazione della lega
    navigate('/leghe/crea');
  };

  // Gestisce il click sul bottone Visualizza Classifica
  const handleVisualizzaClassifica = (lega: Lega) => {
    if (lega.is_pubblica) {
      // Per la lega pubblica, naviga alla visualizzazione lega con id 'public'
      navigate('/leghe/public');
    } else {
      // Per le leghe private, naviga alla visualizzazione lega con l'id della lega
      navigate(`/leghe/${lega.id}`);
    }
  };

  // Verifica se l'utente è admin della lega
  const isLegaAdmin = (lega: Lega) => {
    return lega.creato_da === userId;
  };

  // Icona corona per admin
  const AdminCrown = () => (
    <span className="admin-crown" title="Sei l'amministratore di questa lega">
      👑
    </span>
  );

  // Determina il numero di partecipanti da mostrare per ogni lega
  const getNumeroPartecipanti = (lega: Lega) => {
    if (lega.is_pubblica) {
      return numGiocatori;
    }
    
    // Per le leghe private, per ora mostriamo un valore fisso
    // In futuro, questo dato proverrà dal database
    return 5; // Valore temporaneo
  };

  return (
    <Layout>
      <div className="leghe-page">
        <h1 className="pagina-titolo">Le Mie Leghe</h1>
        
        <div className="crea-lega-container">
          <button 
            className="crea-lega-button"
            onClick={handleCreaLega}
          >
            Crea Lega
          </button>
        </div>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="loading">Caricamento leghe...</div>
        ) : (
          <div className="leghe-lista">
            {leghe.length === 0 ? (
              <p className="no-leghe">Non fai parte di nessuna lega</p>
            ) : (
              leghe.map(lega => (
                <div 
                  key={lega.id} 
                  className={`lega-card ${lega.is_pubblica ? 'lega-pubblica' : 'lega-privata'}`}
                >
                  <div className="lega-header">
                    <h2 className="lega-nome">
                      {lega.nome} {isLegaAdmin(lega) && !lega.is_pubblica && <AdminCrown />}
                    </h2>
                    {lega.is_pubblica && <span className="lega-badge pubblica">Pubblica</span>}
                    {!lega.is_pubblica && <span className="lega-badge privata">Privata</span>}
                  </div>
                  
                  {lega.descrizione && (
                    <p className="lega-descrizione">{lega.descrizione}</p>
                  )}
                  
                  <div className="lega-info">
                    {lega.is_pubblica && posizioneUtente ? (
                      <div className="lega-posizione">
                        <span className="info-label">La tua posizione:</span> 
                        {posizioneUtente === 0 ? 'Non classificato' : `${posizioneUtente}° posto`}
                      </div>
                    ) : (
                      <div className="lega-posizione">
                        <span className="info-label">La tua posizione:</span> 
                        Classifica in arrivo
                      </div>
                    )}
                    
                    <div className="lega-partecipanti">
                      <span className="info-label">Partecipanti:</span> 
                      {getNumeroPartecipanti(lega)}
                    </div>
                  </div>
                  
                  <div className="lega-actions">
                    <button 
                      className="visualizza-lega-button"
                      onClick={() => handleVisualizzaClassifica(lega)}
                    >
                      {lega.is_pubblica ? 'Visualizza Classifica' : 'Visualizza'}
                    </button>
                    
                    {!lega.is_pubblica && isLegaAdmin(lega) && (
                      <button className="invita-button">
                        Invita Giocatori
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default LeghePage; 