import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../services/supabase';
import Layout from '../components/Layout';
import { getClassifica } from '../services/supabase';
import '../styles/LeghePage.css';

// Tipo per le leghe
type Lega = {
  id: string;
  nome: string;
  descrizione?: string;
  is_pubblica: boolean;
  data_creazione?: string;
  creata_da?: string;
  num_partecipanti?: number;
  posizione_utente?: number;
};

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
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLeghe = async () => {
      try {
        setLoading(true);
        
        // Ottieni l'utente corrente
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError || !userData.user) {
          navigate('/login');
          return;
        }
        
        setUserId(userData.user.id);
        
        // Ottieni i dati dalla vista_giocatori per la lega pubblica
        const { classifica: classificaData, error: classificaError } = await getClassifica();
        
        if (classificaError) {
          console.error('Errore nel recupero della classifica:', classificaError);
          throw classificaError;
        }
        
        const giocatori = classificaData as ClassificaItem[];
        
        // Trova la posizione dell'utente corrente nella classifica
        const posizioneUtente = giocatori.findIndex(g => g.id_giocatore === userData.user.id) + 1;
        
        // Per la demo, simula una posizione utente anche per le leghe private
        const posizioneUtenteMock1 = 3;
        const posizioneUtenteMock2 = 2;
        
        // Crea la lega pubblica con i dati richiesti
        const legaPubblica: Lega = {
          id: 'public',
          nome: 'Totocontest 2025',
          descrizione: 'Lega pubblica per vincere fantastici premi!',
          is_pubblica: true,
          num_partecipanti: giocatori.length,
          posizione_utente: posizioneUtente || 0,
          creata_da: 'admin' // Assumiamo che la lega pubblica sia creata dall'admin
        };
        
        // Simulo alcune leghe private
        const legheMock: Lega[] = [
          {
            id: 'friends',
            nome: 'Amici dell\'Hockey',
            descrizione: 'Lega privata per gli amici appassionati di hockey',
            is_pubblica: false,
            data_creazione: '2023-02-15T00:00:00',
            creata_da: 'Mario Rossi',
            num_partecipanti: 8,
            posizione_utente: posizioneUtenteMock1
          },
          {
            id: 'colleghi',
            nome: 'Lega Colleghi',
            descrizione: 'Sfida tra colleghi di lavoro',
            is_pubblica: false,
            data_creazione: '2023-03-10T00:00:00',
            creata_da: userData.user.id,
            num_partecipanti: 5,
            posizione_utente: posizioneUtenteMock2
          }
        ];
        
        // Metti la lega pubblica all'inizio dell'array
        setLeghe([legaPubblica, ...legheMock]);
        
      } catch (err) {
        console.error('Errore nel caricamento delle leghe:', err);
        setError('Si è verificato un errore nel caricamento delle leghe.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeghe();
  }, [navigate]);
  
  const handleCreaLega = () => {
    // Funzionalità da implementare successivamente
    console.log('Creazione lega: funzionalità da implementare');
  };

  // Verifica se l'utente è admin della lega
  const isLegaAdmin = (lega: Lega) => {
    return lega.creata_da === userId;
  };

  // Icona corona per admin
  const AdminCrown = () => (
    <span className="admin-crown" title="Sei l'amministratore di questa lega">
      👑
    </span>
  );

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
                    {lega.posizione_utente !== undefined && (
                      <div className="lega-posizione">
                        <span className="info-label">La tua posizione:</span> 
                        {lega.posizione_utente === 0 ? 'Non classificato' : `${lega.posizione_utente}° posto`}
                      </div>
                    )}
                    
                    {lega.num_partecipanti !== undefined && (
                      <div className="lega-partecipanti">
                        <span className="info-label">Partecipanti:</span> 
                        {lega.num_partecipanti}
                      </div>
                    )}
                  </div>
                  
                  <div className="lega-actions">
                    <button className="visualizza-lega-button">
                      Visualizza Classifica
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