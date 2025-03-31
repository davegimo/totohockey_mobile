import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { getClassifica, getTopPerformers, TopPerformer } from '../services/supabase';
import { useSession } from '../context/SessionContext';
import '../styles/ClassificaPage.css';

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

type ViewMode = 'classifica' | 'top_performers';

const ClassificaPage = () => {
  const { session } = useSession();
  const [classifica, setClassifica] = useState<ClassificaItem[]>([]);
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('punti_totali');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('classifica');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      if (viewMode === 'classifica') {
        const { classifica: classificaData, error: classificaError } = await getClassifica();
        if (classificaError) {
          setError(classificaError.message);
          return;
        }
        setClassifica(classificaData as ClassificaItem[]);
      } else {
        const { topPerformers: topPerformersData, error: topPerformersError } = await getTopPerformers();
        if (topPerformersError) {
          setError(topPerformersError.message);
          return;
        }
        setTopPerformers(topPerformersData as TopPerformer[]);
      }
    } catch (err: any) {
      console.error('Errore durante il recupero dei dati:', err);
      setError(err.message || 'Errore durante il recupero dei dati. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  }, [viewMode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
    } else {
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

  const sortedClassifica = [...classifica].sort((a, b) => {
    const valueA = a[sortField];
    const valueB = b[sortField];
    return sortDirection === 'desc' ? valueB - valueA : valueA - valueB;
  });

  const renderTopPerformers = () => {
    const turni = [...new Set(topPerformers.map(tp => tp.turno))];
    
    return (
      <div className="top-performers-container">
        {turni.map(turno => {
          const performersInTurno = topPerformers
            .filter(tp => tp.turno === turno)
            .sort((a, b) => b.punti_totali - a.punti_totali);
          
          return (
            <div key={turno} className="turno-section">
              <h3>{turno}</h3>
              <table className="top-performers-table">
                <thead>
                  <tr>
                    <th>Pos.</th>
                    <th>Giocatore</th>
                    <th>Punti</th>
                  </tr>
                </thead>
                <tbody>
                  {performersInTurno.map((performer, index) => (
                    <tr key={`${performer.nome_giocatore}-${performer.cognome_giocatore}-${turno}`}>
                      <td className="posizione">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                      </td>
                      <td className="giocatore">
                        {`${performer.nome_giocatore} ${performer.cognome_giocatore}`}
                      </td>
                      <td className="punteggio">
                        <strong>{performer.punti_totali}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Layout>
      <div className="classifica-page">
        <h1>Classifica Generale</h1>
        
        <div className="view-mode-selector">
          <button 
            className={`view-mode-button ${viewMode === 'classifica' ? 'active' : ''}`}
            onClick={() => setViewMode('classifica')}
          >
            Classifica Generale
          </button>
          <button 
            className={`view-mode-button ${viewMode === 'top_performers' ? 'active' : ''}`}
            onClick={() => setViewMode('top_performers')}
          >
            Top Performers
          </button>
        </div>
        
        {viewMode === 'classifica' && (
          <div className="classifica-info">
            L'ordine della classifica, a parità di punti, dipende dal numero di risultati esatti presi e successivamente dal numero di esiti corretti.
          </div>
        )}
        
        {error && <div className="error">{error}</div>}
        
        {loading ? (
          <div className="loading">Caricamento dati...</div>
        ) : viewMode === 'classifica' ? (
          classifica.length === 0 ? (
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
          )
        ) : (
          topPerformers.length === 0 ? (
            <div className="no-classifica">
              <p>Non ci sono ancora dati disponibili per i top performers.</p>
            </div>
          ) : (
            renderTopPerformers()
          )
        )}
      </div>
    </Layout>
  );
};

export default ClassificaPage; 