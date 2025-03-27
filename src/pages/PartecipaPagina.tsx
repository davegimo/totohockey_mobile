import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { 
  partecipaLegaConCodice, 
  getLegaByInviteCode
} from '../services/supabase';
import { useSession } from '../context/SessionContext';
import '../styles/PartecipaPagina.css';

// Tipo per i dettagli della lega
type LegaDettagli = {
  id: string;
  nome: string;
  descrizione: string;
  data_creazione: string;
  numero_partecipanti: number;
  creato_da: string;
  logo_url?: string;
  profiles?: {
    nome: string;
    cognome: string;
  };
  link_scaduto: boolean;
};

const PartecipaPagina: React.FC = () => {
  const { codiceInvito: urlCodiceInvito } = useParams<{ codiceInvito?: string }>();
  const navigate = useNavigate();
  const { session } = useSession();
  const isLoggedIn = !!session;
  const [loading, setLoading] = useState(false);
  const [codiceInvito, setCodiceInvito] = useState(urlCodiceInvito || '');
  const [legaDettagli, setLegaDettagli] = useState<LegaDettagli | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [redirectTimer, setRedirectTimer] = useState(5);
  const [showModal, setShowModal] = useState(false);
  const [cercaLegaInCorso, setCercaLegaInCorso] = useState(false);

  // Cerca automaticamente la lega se c'è un codice nell'URL
  useEffect(() => {
    if (urlCodiceInvito) {
      cercaLega(urlCodiceInvito);
    }
  }, [urlCodiceInvito]);

  // Funzione per cercare la lega dato il codice di invito
  const cercaLega = async (codice: string) => {
    console.log('[cercaLega] Inizio ricerca lega con codice:', codice);
    
    if (!codice) {
      console.log('[cercaLega] Codice mancante, mostrando errore');
      setError('Inserisci un codice di invito valido');
      return;
    }

    setCercaLegaInCorso(true);
    setError(null);
    setLegaDettagli(null);
    
    try {
      console.log('[cercaLega] Chiamata a getLegaByInviteCode con codice:', codice);
      const { lega, error } = await getLegaByInviteCode(codice);
      console.log('[cercaLega] Risposta da getLegaByInviteCode:', { lega, error });
      
      if (error || !lega) {
        console.error('[cercaLega] Errore o lega non trovata:', error);
        setError('Codice di invito non valido o lega non trovata');
        return;
      }
      
      // Verifica se il link è scaduto
      if (lega.link_scaduto) {
        console.log('[cercaLega] Link scaduto per la lega:', lega.nome);
        setError('Il link di invito è scaduto. Chiedi all\'amministratore della lega di generarne uno nuovo.');
        return;
      }
      
      console.log('[cercaLega] Lega trovata con successo, impostazione stato:', lega);
      setLegaDettagli(lega as LegaDettagli);
    } catch (err) {
      console.error('[cercaLega] Eccezione durante la ricerca:', err);
      setError('Si è verificato un errore durante la ricerca della lega');
    } finally {
      console.log('[cercaLega] Ricerca completata, fine stato di caricamento');
      setCercaLegaInCorso(false);
    }
  };

  // Funzione per partecipare alla lega
  const partecipaLega = async () => {
    if (!legaDettagli || !codiceInvito) {
      setError('Informazioni lega mancanti');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const { success, message } = await partecipaLegaConCodice(codiceInvito);
      
      setLoading(false);
      
      if (success) {
        setSuccess(message);
        setShowModal(false);
        
        // Inizia il conto alla rovescia per il reindirizzamento
        let timer = redirectTimer;
        
        const interval = setInterval(() => {
          timer--;
          setRedirectTimer(timer);
          
          if (timer <= 0) {
            clearInterval(interval);
            navigate('/leghe');
          }
        }, 1000);
        
        return () => clearInterval(interval);
      } else {
        setError(message);
      }
    } catch (err) {
      console.error('Errore durante la partecipazione alla lega:', err);
      setLoading(false);
      setError('Si è verificato un errore durante la partecipazione alla lega');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    cercaLega(codiceInvito);
  };

  const handlePartecipa = () => {
    setShowModal(true);
  };

  const handleConfirm = () => {
    partecipaLega();
  };

  const handleCancel = () => {
    setShowModal(false);
  };

  const handleTornaLeghe = () => {
    navigate('/leghe');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <Layout>
      <div className="partecipa-page">
        <h1 className="partecipa-titolo">Partecipa a una Lega</h1>
        
        <div className="partecipa-top-nav">
          <button 
            className="partecipa-back-button"
            onClick={() => navigate('/leghe')}
          >
            ← Torna alle Leghe
          </button>
        </div>
        
        {!isLoggedIn && legaDettagli ? (
          <div className="partecipa-not-logged-in">
            <div className="partecipa-lega-card">
              <div className="partecipa-lega-header">
                <h2 className="partecipa-lega-nome">{legaDettagli.nome}</h2>
                {legaDettagli.logo_url && (
                  <div className="partecipa-lega-logo">
                    <img src={legaDettagli.logo_url} alt={`Logo ${legaDettagli.nome}`} />
                  </div>
                )}
              </div>
              
              <div className="partecipa-lega-info">
                <p className="partecipa-lega-descrizione">
                  {legaDettagli.descrizione || 'Nessuna descrizione disponibile'}
                </p>
                
                <div className="partecipa-lega-details">
                  <div className="partecipa-lega-detail">
                    <span className="partecipa-detail-label">Creata da:</span>
                    <span className="partecipa-detail-value">
                      {legaDettagli.profiles 
                        ? `${legaDettagli.profiles.nome} ${legaDettagli.profiles.cognome}`
                        : 'Admin'}
                    </span>
                  </div>
                  
                  <div className="partecipa-lega-detail">
                    <span className="partecipa-detail-label">Data creazione:</span>
                    <span className="partecipa-detail-value">
                      {formatDate(legaDettagli.data_creazione)}
                    </span>
                  </div>
                  
                  <div className="partecipa-lega-detail">
                    <span className="partecipa-detail-label">Partecipanti:</span>
                    <span className="partecipa-detail-value">
                      {legaDettagli.numero_partecipanti}
                    </span>
                  </div>
                </div>
                
                <div className="partecipa-auth-message">
                  <p>Per partecipare a questa lega, devi effettuare l'accesso o registrarti:</p>
                  <div className="partecipa-auth-buttons">
                    <Link to="/login" className="partecipa-auth-button login">
                      Accedi
                    </Link>
                    <Link to="/register" className="partecipa-auth-button register">
                      Registrati
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : !isLoggedIn && !legaDettagli ? (
          <div className="partecipa-not-logged-in">
            <div className="partecipa-form-container">
              <form onSubmit={handleSubmit} className="partecipa-form">
                <div className="partecipa-form-group">
                  <label htmlFor="codiceInvito" className="partecipa-label">
                    Inserisci il codice di invito:
                  </label>
                  <div className="partecipa-input-group">
                    <input
                      type="text"
                      id="codiceInvito"
                      className="partecipa-input"
                      value={codiceInvito}
                      onChange={(e) => setCodiceInvito(e.target.value.trim().toUpperCase())}
                      placeholder="Es. ABCD1234"
                      autoComplete="off"
                    />
                    <button 
                      type="submit" 
                      className="partecipa-cerca-button"
                      disabled={cercaLegaInCorso}
                    >
                      {cercaLegaInCorso ? 'Ricerca...' : 'Cerca'}
                    </button>
                  </div>
                </div>
              </form>
              
              {error && (
                <div className="partecipa-error-message">
                  <p>{error}</p>
                </div>
              )}
              
              <div className="partecipa-auth-message">
                <p>Per partecipare a una lega, devi effettuare l'accesso o registrarti:</p>
                <div className="partecipa-auth-buttons">
                  <Link to="/login" className="partecipa-auth-button login">
                    Accedi
                  </Link>
                  <Link to="/register" className="partecipa-auth-button register">
                    Registrati
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : !success ? (
          <div className="partecipa-form-container">
            <form onSubmit={handleSubmit} className="partecipa-form">
              <div className="partecipa-form-group">
                <label htmlFor="codiceInvito" className="partecipa-label">
                  Inserisci il codice di invito:
                </label>
                <div className="partecipa-input-group">
                  <input
                    type="text"
                    id="codiceInvito"
                    className="partecipa-input"
                    value={codiceInvito}
                    onChange={(e) => setCodiceInvito(e.target.value.trim().toUpperCase())}
                    placeholder="Es. ABCD1234"
                    autoComplete="off"
                  />
                  <button 
                    type="submit" 
                    className="partecipa-cerca-button"
                    disabled={cercaLegaInCorso}
                  >
                    {cercaLegaInCorso ? 'Ricerca...' : 'Cerca'}
                  </button>
                </div>
              </div>
            </form>
            
            {error && (
              <div className="partecipa-error-message">
                <p>{error}</p>
              </div>
            )}

            {legaDettagli && (
              <div className="partecipa-lega-card">
                <div className="partecipa-lega-header">
                  <h2 className="partecipa-lega-nome">{legaDettagli.nome}</h2>
                  {legaDettagli.logo_url && (
                    <div className="partecipa-lega-logo">
                      <img src={legaDettagli.logo_url} alt={`Logo ${legaDettagli.nome}`} />
                    </div>
                  )}
                </div>
                
                <div className="partecipa-lega-info">
                  <p className="partecipa-lega-descrizione">
                    {legaDettagli.descrizione || 'Nessuna descrizione disponibile'}
                  </p>
                  
                  <div className="partecipa-lega-details">
                    <div className="partecipa-lega-detail">
                      <span className="partecipa-detail-label">Creata da:</span>
                      <span className="partecipa-detail-value">
                        {legaDettagli.profiles 
                          ? `${legaDettagli.profiles.nome} ${legaDettagli.profiles.cognome}`
                          : 'Admin'}
                      </span>
                    </div>
                    
                    <div className="partecipa-lega-detail">
                      <span className="partecipa-detail-label">Data creazione:</span>
                      <span className="partecipa-detail-value">
                        {formatDate(legaDettagli.data_creazione)}
                      </span>
                    </div>
                    
                    <div className="partecipa-lega-detail">
                      <span className="partecipa-detail-label">Partecipanti:</span>
                      <span className="partecipa-detail-value">
                        {legaDettagli.numero_partecipanti}
                      </span>
                    </div>
                  </div>
                  
                  <div className="partecipa-lega-actions">
                    <button 
                      className="partecipa-button"
                      onClick={handlePartecipa}
                      disabled={loading}
                    >
                      Partecipa alla Lega
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="partecipa-success">
            <h2>Operazione completata!</h2>
            <p>{success}</p>
            <p className="partecipa-redirect">
              Verrai reindirizzato tra {redirectTimer} secondi...
            </p>
            <button 
              className="partecipa-button"
              onClick={handleTornaLeghe}
            >
              Vai alle mie leghe
            </button>
          </div>
        )}
        
        {/* Modal di conferma partecipazione */}
        {showModal && (
          <div className="partecipa-modal-overlay">
            <div className="partecipa-modal">
              <h2>Conferma Partecipazione</h2>
              <p>Sei sicuro di voler partecipare alla lega <strong>{legaDettagli?.nome}</strong>?</p>
              
              <div className="partecipa-modal-actions">
                <button 
                  className="partecipa-modal-cancel" 
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Annulla
                </button>
                <button 
                  className="partecipa-modal-confirm" 
                  onClick={handleConfirm}
                  disabled={loading}
                >
                  {loading ? 'Elaborazione...' : 'Conferma'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PartecipaPagina; 