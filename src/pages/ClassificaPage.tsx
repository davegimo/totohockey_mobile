import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { getClassifica } from '../services/supabase';
import { useSession } from '../context/SessionContext';
import '../styles/ClassificaPage.css';
import PullToRefreshWrapper from '../components/PullToRefreshWrapper';

type ClassificaItem = {
  id_giocatore: string;
  nome: string;
  cognome: string;
  punti_totali: number;
  risultati_esatti: number;
  esiti_presi: number;
};

type SortField = 'punti_totali' | 'risultati_esatti' | 'esiti_presi';
type SortDirection = 'asc' | 'desc';

const ClassificaPage = () => {
  const { session } = useSession();
  const [classifica, setClassifica] = useState<ClassificaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('punti_totali');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const fetchClassifica = useCallback(async () => {
    try {
      setLoading(true);
      const { classifica: classificaData, error: classificaError } = await getClassifica();
      
      if (classificaError) {
        setError(classificaError.message);
        return;
      }
      
      setClassifica(classificaData as ClassificaItem[]);
    } catch (err: any) {
      console.error('Errore durante il recupero della classifica:', err);
      setError(err.message || 'Errore durante il recupero della classifica. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClassifica();
  }, [fetchClassifica]);

  const handleRefresh = async () => {
    console.log('Aggiornamento classifica...');
    await fetchClassifica();
    return;
  };

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      // Se il campo è già selezionato, inverti la direzione
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
    } else {
      // Altrimenti, imposta il nuovo campo e la direzione predefinita (discendente)
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (field !== sortField) return null;
    
    return (
      <span className="sort-icon">
        {sortDirection === 'desc' ? '▼' : '▲'}
      </span>
    );
  };

  // Ordina la classifica in base al campo e alla direzione selezionati
  const sortedClassifica = [...classifica].sort((a, b) => {
    const valueA = a[sortField];
    const valueB = b[sortField];
    
    if (sortDirection === 'desc') {
      return valueB - valueA;
    } else {
      return valueA - valueB;
    }
  });

  return (
    <Layout>
      <PullToRefreshWrapper onRefresh={handleRefresh}>
        <div className="classifica-page">
          <h1>Classifica Generale</h1>
          
          <div className="classifica-info">
            L'ordine della classifica, a parità di punti, dipende dal numero di risultati esatti presi e successivamente dal numero di esiti corretti.
          </div>
          
          {error && <div className="error">{error}</div>}
          
          {loading ? (
            <div className="loading">Caricamento classifica...</div>
          ) : classifica.length === 0 ? (
            <div className="no-classifica">
              <p>Non ci sono ancora dati disponibili per la classifica.</p>
            </div>
          ) : (
            <div className="classifica-container">
              <table className="classifica-table">
                <thead>
                  <tr>
                    <th>Pos.</th>
                    <th>Giocatore</th>
                    <th 
                      className="sortable"
                      onClick={() => handleSort('punti_totali')}
                    >
                      Pt {getSortIcon('punti_totali')}
                    </th>
                    <th 
                      className="sortable"
                      onClick={() => handleSort('risultati_esatti')}
                    >
                      R {getSortIcon('risultati_esatti')}
                    </th>
                    <th 
                      className="sortable"
                      onClick={() => handleSort('esiti_presi')}
                    >
                      E {getSortIcon('esiti_presi')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedClassifica.map((item, index) => {
                    const isCurrentUser = session?.user?.id === item.id_giocatore;
                    const posizione = index + 1;
                    
                    return (
                      <tr key={item.id_giocatore} className={isCurrentUser ? 'current-user' : ''}>
                        <td className="posizione">
                          {posizione === 1 ? (
                            <span key="gold" className="medal">🥇</span>
                          ) : posizione === 2 ? (
                            <span key="silver" className="medal">🥈</span>
                          ) : posizione === 3 ? (
                            <span key="bronze" className="medal">🥉</span>
                          ) : (
                            posizione
                          )}
                        </td>
                        <td className="giocatore">
                          <Link to={`/giocatore/${item.id_giocatore}`} className="giocatore-link">
                            {`${item.nome} ${item.cognome}`}
                          </Link>
                          {isCurrentUser && (
                            <span className="tu-label">(Tu)</span>
                          )}
                        </td>
                        <td className="punteggio">
                          <strong>{item.punti_totali}</strong>
                        </td>
                        <td className="risultati">
                          {item.risultati_esatti}
                        </td>
                        <td className="esiti">
                          {item.esiti_presi}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </PullToRefreshWrapper>
    </Layout>
  );
};

export default ClassificaPage; 