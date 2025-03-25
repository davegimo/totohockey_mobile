import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import supabase from '../services/supabase';
import Layout from '../components/Layout';
import { ClassificaLega, Lega, getClassificaLega, isLegaAdmin } from '../services/supabase';
import '../styles/LegaPage.css';

const LegaPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [lega, setLega] = useState<Lega | null>(null);
  const [classifica, setClassifica] = useState<ClassificaLega[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingRicalcolo, setLoadingRicalcolo] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchLegaData = async () => {
      if (!id) {
        setError('ID lega non valido');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Verifica autenticazione utente
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
          navigate('/login');
          return;
        }
        
        // Verifica se l'utente è admin della lega
        const { isAdmin: adminCheck, error: adminError } = await isLegaAdmin(id);
        if (!adminError) {
          setIsAdmin(adminCheck);
        }
        
        // Recupera i dati della lega
        let legaData: Lega | null = null;
        
        // Se l'ID è 'public', crea una lega pubblica fittizia
        if (id === 'public') {
          legaData = {
            id: 'public',
            nome: 'Totocontest 2025',
            descrizione: 'Lega pubblica per vincere fantastici premi!',
            is_pubblica: true,
            creato_da: 'admin',
            data_creazione: new Date().toISOString(),
            ultima_modifica: new Date().toISOString(),
            attiva: true
          };
        } else {
          // Recupera i dati della lega dal database
          const { data: legheData, error: legaError } = await supabase
            .from('leghe')
            .select('*')
            .eq('id', id)
            .single();
            
          if (legaError || !legheData) {
            throw new Error('Lega non trovata');
          }
          
          legaData = legheData as Lega;
        }
        
        setLega(legaData);
        
        // Recupera la classifica della lega
        const { classifica: classificaData, error: classificaError } = await getClassificaLega(id);
        
        if (classificaError) {
          console.error('Errore nel recupero della classifica:', classificaError);
          throw classificaError;
        }
        
        setClassifica(classificaData);
        
      } catch (err) {
        console.error('Errore nel caricamento della lega:', err);
        setError('Si è verificato un errore nel caricamento della lega.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchLegaData();
  }, [id, navigate]);
  
  const handleRicalcolaClassifica = async () => {
    if (!id || !isAdmin) return;
    
    try {
      setLoadingRicalcolo(true);
      setSuccessMessage(null);
      
      // Qui si potrebbe implementare una funzione specifica per ricalcolare solo la classifica della lega
      // Per ora, utilizziamo un approccio semplificato simulando il ricalcolo
      
      // 1. Ricalcola i punteggi per i membri della lega
      const { data: pronosticiUtenti, error: pronosticiError } = await supabase
        .from('pronostici')
        .select('partita_id, punti, user_id')
        .in('user_id', classifica.map(item => item.giocatore_id));
      
      if (pronosticiError) {
        throw pronosticiError;
      }
      
      // 2. Aggiorna la tabella giocatori_leghe con i nuovi punteggi
      for (const giocatore of classifica) {
        const pronosticiGiocatore = pronosticiUtenti?.filter(p => p.user_id === giocatore.giocatore_id) || [];
        const puntiTotali = pronosticiGiocatore.reduce((sum, p) => sum + (p.punti || 0), 0);
        const risultatiEsatti = pronosticiGiocatore.filter(p => p.punti === 3).length;
        const esitiPresi = pronosticiGiocatore.filter(p => p.punti === 1).length;
        
        await supabase
          .from('giocatori_leghe')
          .update({
            punti_totali: puntiTotali,
            risultati_esatti: risultatiEsatti,
            esiti_presi: esitiPresi,
            ultima_modifica: new Date().toISOString()
          })
          .eq('giocatore_id', giocatore.giocatore_id)
          .eq('lega_id', id);
      }
      
      // 3. Ricarica la classifica aggiornata
      const { classifica: nuovaClassifica, error: nuovaClassificaError } = await getClassificaLega(id);
      
      if (nuovaClassificaError) {
        throw nuovaClassificaError;
      }
      
      setClassifica(nuovaClassifica);
      setSuccessMessage('Classifica ricalcolata con successo!');
      
    } catch (err) {
      console.error('Errore durante il ricalcolo della classifica:', err);
      setError('Si è verificato un errore durante il ricalcolo della classifica.');
    } finally {
      setLoadingRicalcolo(false);
    }
  };
  
  const handleTornaLeghe = () => {
    navigate('/leghe');
  };

  if (loading) {
    return (
      <Layout>
        <div className="lega-page">
          <div className="loading">Caricamento dati lega...</div>
        </div>
      </Layout>
    );
  }
  
  if (error || !lega) {
    return (
      <Layout>
        <div className="lega-page">
          <div className="error-message">{error || 'Errore nel caricamento della lega'}</div>
          <button className="torna-leghe-button" onClick={handleTornaLeghe}>
            Torna alle Leghe
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="lega-page">
        <button className="torna-leghe-button" onClick={handleTornaLeghe}>
          &larr; Torna alle Leghe
        </button>
        
        <div className="lega-header-container">
          <div className="lega-logo-container">
            {lega.logo_url ? (
              <img 
                src={lega.logo_url} 
                alt={`Logo ${lega.nome}`} 
                className="lega-logo" 
              />
            ) : (
              <div className="lega-logo-placeholder">
                {lega.nome.substring(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          
          <div className="lega-info-container">
            <h1 className="lega-nome">
              {lega.nome}
              {lega.is_pubblica && <span className="lega-badge pubblica">Pubblica</span>}
              {!lega.is_pubblica && <span className="lega-badge privata">Privata</span>}
            </h1>
            
            {lega.descrizione && (
              <p className="lega-descrizione">{lega.descrizione}</p>
            )}
            
            <p className="lega-partecipanti">
              <span className="info-label">Partecipanti:</span> {classifica.length}
            </p>
          </div>
        </div>
        
        {isAdmin && (
          <div className="admin-actions">
            <button 
              className="ricalcola-button"
              onClick={handleRicalcolaClassifica}
              disabled={loadingRicalcolo}
            >
              {loadingRicalcolo ? 'Ricalcolo in corso...' : 'Ricalcola Classifica'}
            </button>
            
            {!lega.is_pubblica && (
              <button className="invita-button">
                Invita Giocatori
              </button>
            )}
          </div>
        )}
        
        {successMessage && (
          <div className="success-message">
            {successMessage}
          </div>
        )}
        
        <div className="lega-classifica-container">
          <h2 className="classifica-titolo">Classifica</h2>
          
          {classifica.length === 0 ? (
            <p className="no-classifica">
              Non ci sono ancora giocatori classificati in questa lega.
            </p>
          ) : (
            <div className="classifica-table-container">
              <table className="classifica-table">
                <thead>
                  <tr>
                    <th className="position-col">Pos.</th>
                    <th className="player-col">Giocatore</th>
                    <th className="points-col">Punti</th>
                    <th className="results-col">Ris. Esatti</th>
                    <th className="outcomes-col">Esiti</th>
                  </tr>
                </thead>
                <tbody>
                  {classifica.map((item) => (
                    <tr key={item.id} className={item.is_admin ? 'admin-row' : ''}>
                      <td className="position-col">{item.posizione}</td>
                      <td className="player-col">
                        <span className="player-name">{item.nome} {item.cognome}</span>
                        {item.is_admin && (
                          <span className="admin-badge" title="Amministratore">👑</span>
                        )}
                      </td>
                      <td className="points-col">{item.punti_totali}</td>
                      <td className="results-col">{item.risultati_esatti}</td>
                      <td className="outcomes-col">{item.esiti_presi}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default LegaPage; 