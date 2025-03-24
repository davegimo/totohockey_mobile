import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../services/supabase';
import Layout from '../components/Layout';
import '../styles/LeghePage.css';

// Tipo per le leghe
type Lega = {
  id: string;
  nome: string;
  descrizione?: string;
  is_pubblica: boolean;
  data_creazione: string;
  creata_da?: string;
  num_partecipanti?: number;
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
        
        // Per ora simulo che ci sia una lega pubblica e alcune leghe private
        // In futuro questo sarà sostituito con una vera query al database
        
        const legaPubblica: Lega = {
          id: 'public',
          nome: 'Lega Pubblica Totohockey',
          descrizione: 'La lega principale che include tutti i giocatori',
          is_pubblica: true,
          data_creazione: '2023-01-01T00:00:00',
          num_partecipanti: 50 // Numero simulato
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
            num_partecipanti: 8
          },
          {
            id: 'colleghi',
            nome: 'Lega Colleghi',
            descrizione: 'Sfida tra colleghi di lavoro',
            is_pubblica: false,
            data_creazione: '2023-03-10T00:00:00',
            creata_da: userData.user.id,
            num_partecipanti: 5
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
                    <h2 className="lega-nome">{lega.nome}</h2>
                    {lega.is_pubblica && <span className="lega-badge pubblica">Pubblica</span>}
                    {!lega.is_pubblica && <span className="lega-badge privata">Privata</span>}
                  </div>
                  
                  {lega.descrizione && (
                    <p className="lega-descrizione">{lega.descrizione}</p>
                  )}
                  
                  <div className="lega-info">
                    <div className="lega-data">
                      <span className="info-label">Creata il:</span> 
                      {new Date(lega.data_creazione).toLocaleDateString('it-IT')}
                    </div>
                    
                    {lega.num_partecipanti !== undefined && (
                      <div className="lega-partecipanti">
                        <span className="info-label">Partecipanti:</span> 
                        {lega.num_partecipanti}
                      </div>
                    )}
                    
                    {!lega.is_pubblica && lega.creata_da && (
                      <div className="lega-creatore">
                        <span className="info-label">Creata da:</span> 
                        {lega.creata_da === userId ? 'Te' : lega.creata_da}
                      </div>
                    )}
                  </div>
                  
                  <div className="lega-actions">
                    <button className="visualizza-lega-button">
                      Visualizza Classifica
                    </button>
                    
                    {!lega.is_pubblica && (
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