import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { getClassifica } from '../services/supabase';
import { useSession } from '../context/SessionContext';
import '../styles/ClassificaPage.css';

type ClassificaItem = {
  id: string;
  nome: string;
  cognome: string;
  punteggio: number;
};

const ClassificaPage = () => {
  const { session } = useSession();
  const [classifica, setClassifica] = useState<ClassificaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClassifica = async () => {
      try {
        setLoading(true);
        const { classifica: classificaData, error: classificaError } = await getClassifica();
        
        if (classificaError) {
          throw classificaError;
        }
        
        setClassifica(classificaData as ClassificaItem[]);
        setLoading(false);
      } catch (err: any) {
        console.error('Errore durante il recupero della classifica:', err);
        setError(err.message || 'Errore durante il recupero della classifica. Riprova più tardi.');
        setLoading(false);
      }
    };
    
    fetchClassifica();
  }, []);

  return (
    <Layout>
      <div className="classifica-page">
        <h1>Classifica Generale</h1>

        <section className="regole-intro">
          <p>
            Qui puoi vedere la classifica generale dei giocatori. Una volta che i risultati delle partite sono stati inseriti, potrai vedere la tua posizione nella classifica e confrontarti con gli altri giocatori cliccando sul loro nome!
          </p>
        </section>
        
        {error && <div className="error">{error}</div>}
        
        {loading ? (
          <div className="loading">Caricamento classifica...</div>
        ) : classifica.length === 0 ? (
          <div className="no-classifica">Nessun dato disponibile</div>
        ) : (
          <div className="classifica-container">
            <table className="classifica-table">
              <thead>
                <tr>
                  <th>Pos.</th>
                  <th>Giocatore</th>
                  <th>Punti</th>
                </tr>
              </thead>
              <tbody>
                {classifica.map((item, index) => {
                  const isCurrentUser = session?.user?.id === item.id;
                  const posizione = index + 1;
                  
                  return (
                    <tr 
                      key={item.id} 
                      className={isCurrentUser ? 'current-user' : ''}
                    >
                      <td className="posizione">
                        {posizione <= 3 ? (
                          <span className="medal">
                            {posizione === 1 ? '🥇' : 
                             posizione === 2 ? '🥈' : '🥉'}
                          </span>
                        ) : (
                          posizione
                        )}
                      </td>
                      <td className="giocatore">
                        <Link to={`/giocatore/${item.id}`} className="giocatore-link">
                          {`${item.nome} ${item.cognome}`}
                          {isCurrentUser && (
                            <span className="tu-label">(Tu)</span>
                          )}
                        </Link>
                      </td>
                      <td className="punteggio">{item.punteggio}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ClassificaPage; 