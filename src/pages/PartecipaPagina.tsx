import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { partecipaLegaConCodice, getCurrentUser } from '../services/supabase';
import '../styles/PartecipaPagina.css';

const PartecipaPagina: React.FC = () => {
  const { codiceInvito } = useParams<{ codiceInvito: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [redirectTimer, setRedirectTimer] = useState(15); // Aumentato a 15 secondi per avere più tempo di vedere cosa succede
  const [legaId, setLegaId] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Funzione per aggiungere log
  const addLog = (message: string) => {
    console.log(message);
    setLogs(prevLogs => [...prevLogs, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Verifica l'autenticazione
  useEffect(() => {
    const checkAuth = async () => {
      addLog('Verifica autenticazione...');
      const user = await getCurrentUser();
      
      if (user) {
        addLog(`Utente autenticato: ${user.id}`);
        setIsAuthenticated(true);
      } else {
        addLog('Utente non autenticato. Reindirizzamento alla pagina di login...');
        setIsAuthenticated(false);
        
        // Salva il codice di invito nella sessione per poterlo recuperare dopo il login
        if (codiceInvito) {
          sessionStorage.setItem('pendingInvite', codiceInvito);
          addLog(`Codice invito ${codiceInvito} salvato in sessione per dopo il login`);
        }
        
        // Reindirizza al login dopo 2 secondi (per vedere i log)
        setTimeout(() => {
          navigate('/login', { state: { redirectAfterLogin: `/partecipa/${codiceInvito}` } });
        }, 2000);
      }
    };
    
    checkAuth();
  }, [codiceInvito, navigate]);

  useEffect(() => {
    const partecipa = async () => {
      // Non procedere se l'utente non è autenticato o se lo stato di autenticazione non è ancora verificato
      if (isAuthenticated !== true) {
        return;
      }
      
      addLog(`Avvio funzione partecipa con codice: ${codiceInvito}`);
      
      if (!codiceInvito) {
        addLog('Codice invito non valido (vuoto)');
        setError('Codice invito non valido');
        setLoading(false);
        return;
      }

      try {
        addLog(`Tentativo di partecipazione con codice: ${codiceInvito}`);
        
        const { success, message, lega } = await partecipaLegaConCodice(codiceInvito);
        
        addLog(`Risposta ricevuta: success=${success}, message=${message}, lega=${lega ? 'presente' : 'assente'}`);
        
        setLoading(false);
        
        if (success) {
          if (lega) {
            addLog(`Lega trovata con ID: ${lega.id}, nome: ${lega.nome}`);
            setLegaId(lega.id);
          } else {
            addLog('Lega non trovata nella risposta nonostante success=true');
          }
          
          setSuccess(message);
          addLog(`Successo: ${message}`);
          
          // Se la partecipazione è andata a buon fine, inizia il conto alla rovescia per il reindirizzamento
          let timer = redirectTimer;
          setRedirectTimer(timer);
          
          // Imposta un intervallo per aggiornare il timer
          const interval = setInterval(() => {
            timer--;
            setRedirectTimer(timer);
            
            if (timer <= 0) {
              clearInterval(interval);
              if (lega) {
                addLog(`Reindirizzamento a /leghe/${lega.id}`);
                navigate(`/leghe/${lega.id}`);
              } else {
                addLog('Reindirizzamento a /leghe');
                navigate('/leghe');
              }
            }
          }, 1000);
          
          return () => clearInterval(interval);
        } else {
          addLog(`Errore: ${message}`);
          setError(message);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
        addLog(`Eccezione: ${errorMessage}`);
        console.error('Errore durante la partecipazione alla lega:', error);
        setLoading(false);
        setError(error instanceof Error ? error.message : 'Si è verificato un errore durante la partecipazione alla lega');
      }
    };

    partecipa();
  }, [codiceInvito, navigate, redirectTimer, isAuthenticated]);

  const handleTornaLeghe = () => {
    if (legaId) {
      addLog(`Clic su bottone - navigazione a /leghe/${legaId}`);
      navigate(`/leghe/${legaId}`);
    } else {
      addLog('Clic su bottone - navigazione a /leghe');
      navigate('/leghe');
    }
  };

  // Renderizza un messaggio di controllo autenticazione se lo stato non è ancora definito
  if (isAuthenticated === false) {
    return (
      <Layout>
        <div className="partecipa-page">
          <h1 className="partecipa-titolo">Reindirizzamento</h1>
          <div className="partecipa-loading">
            <p>Devi eseguire il login per partecipare alla lega.</p>
            <p>Stai per essere reindirizzato alla pagina di login...</p>
            <div className="partecipa-spinner"></div>
          </div>
          {/* Area di log, visibile solo in ambiente di sviluppo */}
          {import.meta.env.DEV && (
            <div className="partecipa-logs">
              <h3>Log di debug:</h3>
              <pre>
                {logs.length > 0 ? 
                  logs.map((log, index) => <div key={index}>{log}</div>) : 
                  'Nessun log disponibile.'}
              </pre>
              <div>
                <strong>Codice invito:</strong> {codiceInvito || 'non disponibile'}
              </div>
            </div>
          )}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="partecipa-page">
        <h1 className="partecipa-titolo">Partecipa alla Lega</h1>
        
        {isAuthenticated === null ? (
          <div className="partecipa-loading">
            <p>Verifica autenticazione in corso...</p>
            <div className="partecipa-spinner"></div>
          </div>
        ) : loading ? (
          <div className="partecipa-loading">
            <p>Stiamo elaborando la tua richiesta...</p>
            <div className="partecipa-spinner"></div>
          </div>
        ) : error ? (
          <div className="partecipa-error">
            <h2>Si è verificato un errore</h2>
            <p>{error}</p>
            <button 
              className="partecipa-button"
              onClick={handleTornaLeghe}
            >
              Torna alle mie leghe
            </button>
          </div>
        ) : success ? (
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
        ) : (
          <div className="partecipa-error">
            <h2>Codice non valido</h2>
            <p>Il codice di invito non è valido o è scaduto.</p>
            <button 
              className="partecipa-button"
              onClick={handleTornaLeghe}
            >
              Torna alle mie leghe
            </button>
          </div>
        )}
        
        {/* Area di log, visibile solo in ambiente di sviluppo */}
        {import.meta.env.DEV && (
          <div className="partecipa-logs">
            <h3>Log di debug:</h3>
            <pre>
              {logs.length > 0 ? 
                logs.map((log, index) => <div key={index}>{log}</div>) : 
                'Nessun log disponibile.'}
            </pre>
            <div>
              <strong>Codice invito:</strong> {codiceInvito || 'non disponibile'}
            </div>
            <div>
              <strong>Stato autenticazione:</strong> {isAuthenticated === null ? 'verificando...' : isAuthenticated ? 'autenticato' : 'non autenticato'}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PartecipaPagina; 