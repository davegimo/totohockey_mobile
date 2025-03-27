import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import supabase from '../services/supabase';
import Layout from '../components/Layout';
import { ClassificaLega, Lega, getClassificaLega, isLegaAdmin, rigeneraLinkInvito, ricalcolaPunteggiLega } from '../services/supabase';
import InvitoModal from '../components/InvitoModal';
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
  const [showInvitoModal, setShowInvitoModal] = useState(false);
  const [isLinkScaduto, setIsLinkScaduto] = useState(false);
  
  // Funzione per verificare se il link è scaduto
  const verificaScadenzaLink = (ultimoInvito: string | null | undefined) => {
    if (!ultimoInvito) return true;
    
    const dataUltimoInvito = new Date(ultimoInvito);
    const now = new Date();
    const diffInHours = (now.getTime() - dataUltimoInvito.getTime()) / (1000 * 60 * 60);
    
    return diffInHours > 12;
  };
  
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
          
          // Verifica se il link di invito è scaduto
          setIsLinkScaduto(verificaScadenzaLink(legaData.ultimo_invito));
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
    
    const legaId = id.toString();
    
    try {
      setLoadingRicalcolo(true);
      setSuccessMessage(null);
      
      // Chiama la funzione per ricalcolare i punteggi della lega
      const { success, error } = await ricalcolaPunteggiLega(legaId);
      
      if (!success || error) {
        throw new Error(error || 'Errore durante il ricalcolo della classifica');
      }
      
      // Ricarica la classifica aggiornata
      const { classifica: nuovaClassifica, error: nuovaClassificaError } = await getClassificaLega(legaId);
      
      if (nuovaClassificaError) {
        throw nuovaClassificaError;
      }
      
      setClassifica(nuovaClassifica);
      setSuccessMessage('Classifica ricalcolata con successo!');
      
    } catch (err) {
      console.error('Errore durante il ricalcolo della classifica:', err);
      setError(err instanceof Error ? err.message : 'Si è verificato un errore durante il ricalcolo della classifica.');
    } finally {
      setLoadingRicalcolo(false);
    }
  };
  
  const handleTornaLeghe = () => {
    navigate('/leghe');
  };
  
  const handleRigeneraLink = async () => {
    if (!id || !isAdmin) return;
    
    try {
      const { success, codiceInvito, ultimoInvito, error: regenerationError } = await rigeneraLinkInvito(id);
      
      if (!success || regenerationError) {
        throw new Error('Errore nella rigenerazione del link');
      }
      
      // Aggiorna la lega con il nuovo codice
      setLega(prevLega => {
        if (!prevLega) return null;
        return {
          ...prevLega,
          codice_invito: codiceInvito,
          ultimo_invito: ultimoInvito
        };
      });
      
      // Aggiorna lo stato di scadenza del link
      setIsLinkScaduto(false);
      
      setSuccessMessage('Link di invito rigenerato con successo!');
      setTimeout(() => setSuccessMessage(null), 3000);
      
    } catch (err) {
      console.error('Errore nella rigenerazione del link:', err);
      setError('Si è verificato un errore durante la rigenerazione del link di invito.');
      setTimeout(() => setError(null), 3000);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="lega-dettaglio-page">
          <div className="lega-dettaglio-loading">Caricamento dati lega...</div>
        </div>
      </Layout>
    );
  }
  
  if (error || !lega) {
    return (
      <Layout>
        <div className="lega-dettaglio-page">
          <div className="lega-dettaglio-error-message">{error || 'Errore nel caricamento della lega'}</div>
          <button className="lega-dettaglio-torna-button" onClick={handleTornaLeghe}>
            Torna alle Leghe
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="lega-dettaglio-page">
        <button className="lega-dettaglio-torna-button" onClick={handleTornaLeghe}>
          &larr; Torna alle Leghe
        </button>
        
        <div className="lega-dettaglio-header">
          <div className="lega-dettaglio-logo-container">
            {lega.logo_url ? (
              <img 
                src={lega.logo_url} 
                alt={`Logo ${lega.nome}`} 
                className="lega-dettaglio-logo" 
              />
            ) : (
              <div className="lega-dettaglio-logo-placeholder">
                {lega.nome.substring(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          
          <div className="lega-dettaglio-info-container">
            <h1 className="lega-dettaglio-nome">
              {lega.nome}
              {lega.is_pubblica && <span className="lega-dettaglio-badge pubblica">Pubblica</span>}
              {!lega.is_pubblica && <span className="lega-dettaglio-badge privata">Privata</span>}
            </h1>
            
            {lega.descrizione && (
              <p className="lega-dettaglio-descrizione">{lega.descrizione}</p>
            )}
            
            <p className="lega-dettaglio-partecipanti">
              <span className="lega-dettaglio-info-label">Partecipanti:</span> {classifica.length}
            </p>
          </div>
        </div>
        
        {isAdmin && (
          <div className="lega-dettaglio-admin-actions">
            <button 
              className="lega-dettaglio-ricalcola-button"
              onClick={handleRicalcolaClassifica}
              disabled={loadingRicalcolo}
            >
              {loadingRicalcolo ? 'Ricalcolo in corso...' : 'Ricalcola Classifica'}
            </button>
            
            {!lega.is_pubblica && (
              <button 
                className="lega-dettaglio-invita-button"
                onClick={() => setShowInvitoModal(true)}
              >
                Invita Giocatori
              </button>
            )}
          </div>
        )}
        
        {successMessage && (
          <div className="lega-dettaglio-success-message">
            {successMessage}
          </div>
        )}
        
        <div className="lega-dettaglio-classifica-container">
          <h2 className="lega-dettaglio-classifica-titolo">Classifica</h2>
          
          {classifica.length === 0 ? (
            <p className="lega-dettaglio-no-classifica">
              Non ci sono ancora giocatori classificati in questa lega.
            </p>
          ) : (
            <div className="lega-dettaglio-classifica-table-container">
              <table className="lega-dettaglio-classifica-table">
                <thead>
                  <tr>
                    <th className="lega-dettaglio-position-col">Pos.</th>
                    <th className="lega-dettaglio-player-col">Giocatore</th>
                    <th className="lega-dettaglio-points-col">Punti</th>
                    <th className="lega-dettaglio-results-col">
                      <span className="header-full">Ris. Esatti</span>
                      <span className="header-short">R</span>
                    </th>
                    <th className="lega-dettaglio-outcomes-col">
                      <span className="header-full">Esiti</span>
                      <span className="header-short">E</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {classifica.map((item) => (
                    <tr key={item.id} className={item.is_admin ? 'lega-dettaglio-admin-row' : ''}>
                      <td className="lega-dettaglio-position-col">{item.posizione}</td>
                      <td className="lega-dettaglio-player-col">
                        <span 
                          className="lega-dettaglio-player-name"
                          onClick={() => navigate(`/giocatore/${item.giocatore_id}?lega_id=${id}`)}
                          style={{ cursor: 'pointer' }}
                        >
                          {item.nome} {item.cognome}
                        </span>
                        {item.is_admin && (
                          <span className="lega-dettaglio-admin-badge" title="Amministratore">👑</span>
                        )}
                      </td>
                      <td className="lega-dettaglio-points-col">{item.punti_totali}</td>
                      <td className="lega-dettaglio-results-col">
                        <span className="data-value">{item.risultati_esatti}</span>
                      </td>
                      <td className="lega-dettaglio-outcomes-col">
                        <span className="data-value">{item.esiti_presi}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Modal per l'invito dei giocatori */}
        <InvitoModal 
          isOpen={showInvitoModal}
          onClose={() => setShowInvitoModal(false)}
          codiceLega={lega.codice_invito || ''}
          nomeLega={lega.nome}
          isLinkScaduto={isLinkScaduto}
          ultimoInvito={lega.ultimo_invito || null}
          onRigeneraLink={handleRigeneraLink}
        />
      </div>
    </Layout>
  );
};

export default LegaPage; 