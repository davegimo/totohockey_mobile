import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { 
  createPartita, 
  deletePartita, 
  getPartite, 
  getSquadre, 
  isAdmin, 
  updateRisultatoPartita, 
  ricalcolaPunteggiUtenti,
  getTurni,
  createTurno,
  deleteTurno,
  Turno
} from '../services/supabase';
import '../styles/AdminPage.css';

const AdminPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [squadre, setSquadre] = useState<any[]>([]);
  const [partite, setPartite] = useState<any[]>([]);
  const [turni, setTurni] = useState<Turno[]>([]);
  const [selectedTurno, setSelectedTurno] = useState<string>('');
  const [formData, setFormData] = useState({
    turno_id: '',
    squadra_casa_id: '',
    squadra_ospite_id: '',
    data: '',
    campionato: 'Elite Maschile'
  });
  const [turnoFormData, setTurnoFormData] = useState({
    descrizione: '',
    data_limite: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [partitaToDelete, setPartitaToDelete] = useState<string | null>(null);
  const [deleteTurnoModalOpen, setDeleteTurnoModalOpen] = useState(false);
  const [turnoToDelete, setTurnoToDelete] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [partitaToEdit, setPartitaToEdit] = useState<string | null>(null);
  const [risultatoForm, setRisultatoForm] = useState({
    risultato_casa: 0,
    risultato_ospite: 0
  });
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [activeTab, setActiveTab] = useState<'turni' | 'partite'>('turni');

  useEffect(() => {
    checkAdmin();
    fetchSquadre();
    fetchTurni();
  }, []);

  useEffect(() => {
    if (selectedTurno) {
      fetchPartite(selectedTurno);
      setFormData(prev => ({ ...prev, turno_id: selectedTurno }));
    } else {
      setPartite([]);
    }
  }, [selectedTurno]);

  const checkAdmin = async () => {
    try {
      const { isAdminUser: admin, error } = await isAdmin();
      if (error || !admin) {
        console.error('Non sei un amministratore:', error);
        navigate('/');
        return;
      }
      setLoading(false);
    } catch (error) {
      console.error('Errore durante il controllo dei permessi:', error);
      navigate('/');
    }
  };

  const fetchSquadre = async () => {
    try {
      const { squadre, error } = await getSquadre();
      if (error) {
        console.error('Errore durante il recupero delle squadre:', error);
        return;
      }
      setSquadre(squadre);
    } catch (error) {
      console.error('Errore durante il recupero delle squadre:', error);
    }
  };

  const fetchTurni = async () => {
    try {
      const { turni, error } = await getTurni();
      if (error) {
        console.error('Errore durante il recupero dei turni:', error);
        return;
      }
      setTurni(turni);
      if (turni.length > 0) {
        setSelectedTurno(turni[0].id);
      }
    } catch (error) {
      console.error('Errore durante il recupero dei turni:', error);
    }
  };

  const fetchPartite = async (turnoId: string) => {
    try {
      const { partite, error } = await getPartite(turnoId);
      if (error) {
        console.error('Errore durante il recupero delle partite:', error);
        return;
      }
      setPartite(partite);
    } catch (error) {
      console.error('Errore durante il recupero delle partite:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTurnoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTurnoFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTurnoSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTurno(e.target.value);
  };

  const handleCreatePartita = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTurno || !formData.squadra_casa_id || !formData.squadra_ospite_id || !formData.data || !formData.campionato) {
      setError('Tutti i campi sono obbligatori');
      return;
    }

    if (formData.squadra_casa_id === formData.squadra_ospite_id) {
      setError('Le squadre devono essere diverse');
      return;
    }

    setError('');

    try {
      const { error } = await createPartita(
        selectedTurno,
        parseInt(formData.squadra_casa_id),
        parseInt(formData.squadra_ospite_id),
        formData.data,
        formData.campionato
      );

      if (error) {
        setError(`Errore durante la creazione della partita`);
        return;
      }

      // Aggiorna la lista delle partite
      fetchPartite(selectedTurno);
      
      // Reset form
      setFormData({
        turno_id: selectedTurno,
        squadra_casa_id: '',
        squadra_ospite_id: '',
        data: '',
        campionato: 'Elite Maschile'
      });
      
    } catch (error) {
      console.error('Errore durante la creazione della partita:', error);
      setError('Si è verificato un errore durante la creazione della partita');
    }
  };

  const handleTurnoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!turnoFormData.descrizione || !turnoFormData.data_limite) {
      setError('Tutti i campi sono obbligatori');
      return;
    }
    
    try {
      const { error } = await createTurno(turnoFormData);
      
      if (error) {
        console.error('Errore durante la creazione del turno:', error);
        setError('Errore durante la creazione del turno');
        return;
      }
      
      console.log('Turno creato con successo');
      setSuccess('Turno creato con successo');
      
      // Reset form
      setTurnoFormData({
        descrizione: '',
        data_limite: ''
      });
      
      // Refresh turni
      fetchTurni();
      
    } catch (error) {
      console.error('Errore durante la creazione del turno:', error);
      setError('Errore durante la creazione del turno');
    }
  };

  const handleDeleteClick = (partitaId: string) => {
    setPartitaToDelete(partitaId);
    setDeleteModalOpen(true);
  };

  const handleDeleteTurnoClick = (turnoId: string) => {
    setTurnoToDelete(turnoId);
    setDeleteTurnoModalOpen(true);
  };

  const handleEditClick = (partita: any) => {
    setPartitaToEdit(partita.id);
    setRisultatoForm({
      risultato_casa: partita.risultato_casa || 0,
      risultato_ospite: partita.risultato_ospite || 0
    });
    setEditModalOpen(true);
  };

  const handleRisultatoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRisultatoForm(prev => ({
      ...prev,
      [name]: parseInt(value) || 0
    }));
  };

  const handleConfirmDelete = async () => {
    if (!partitaToDelete) return;
    
    console.log('Eliminazione partita con ID:', partitaToDelete);
    try {
      const { error } = await deletePartita(partitaToDelete);
      if (error) {
        console.error('Errore durante l\'eliminazione della partita:', error);
        setError('Errore durante l\'eliminazione della partita');
      } else {
        console.log('Partita eliminata con successo');
        setSuccess('Partita eliminata con successo');
        // Aggiorna la lista delle partite
        const updatedPartite = partite.filter(p => p.id !== partitaToDelete);
        setPartite(updatedPartite);
      }
    } catch (error) {
      console.error('Errore durante l\'eliminazione della partita:', error);
      setError('Errore durante l\'eliminazione della partita');
    } finally {
      setDeleteModalOpen(false);
      setPartitaToDelete(null);
    }
  };

  const handleConfirmDeleteTurno = async () => {
    if (!turnoToDelete) return;
    
    console.log('Eliminazione turno con ID:', turnoToDelete);
    try {
      const { error } = await deleteTurno(turnoToDelete);
      if (error) {
        console.error('Errore durante l\'eliminazione del turno:', error);
        setError('Errore durante l\'eliminazione del turno: ' + (error instanceof Error ? error.message : 'Errore sconosciuto'));
      } else {
        console.log('Turno eliminato con successo');
        setSuccess('Turno eliminato con successo');
        // Aggiorna la lista dei turni
        const updatedTurni = turni.filter(t => t.id !== turnoToDelete);
        setTurni(updatedTurni);
        if (updatedTurni.length > 0) {
          setSelectedTurno(updatedTurni[0].id);
        } else {
          setSelectedTurno('');
        }
      }
    } catch (error) {
      console.error('Errore durante l\'eliminazione del turno:', error);
      setError('Errore durante l\'eliminazione del turno');
    } finally {
      setDeleteTurnoModalOpen(false);
      setTurnoToDelete(null);
    }
  };

  const handleConfirmEdit = async () => {
    if (!partitaToEdit) return;
    
    console.log('Aggiornamento risultato partita con ID:', partitaToEdit, risultatoForm);
    try {
      const { error } = await updateRisultatoPartita(
        partitaToEdit, 
        risultatoForm.risultato_casa, 
        risultatoForm.risultato_ospite
      );
      
      if (error) {
        console.error('Errore durante l\'aggiornamento del risultato:', error);
        setError('Errore durante l\'aggiornamento del risultato');
      } else {
        console.log('Risultato aggiornato con successo');
        setSuccess('Risultato aggiornato con successo');
        // Aggiorna la lista delle partite
        fetchPartite(selectedTurno);
      }
    } catch (error) {
      console.error('Errore durante l\'aggiornamento del risultato:', error);
      setError('Errore durante l\'aggiornamento del risultato');
    } finally {
      setEditModalOpen(false);
      setPartitaToEdit(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setPartitaToDelete(null);
  };

  const handleCancelDeleteTurno = () => {
    setDeleteTurnoModalOpen(false);
    setTurnoToDelete(null);
  };

  const handleCancelEdit = () => {
    setEditModalOpen(false);
    setPartitaToEdit(null);
  };

  const formatData = (dataString: string) => {
    const data = new Date(dataString);
    return new Intl.DateTimeFormat('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(data);
  };

  const getNomeSquadra = (id: number) => {
    const squadra = squadre.find(s => s.id === id);
    return squadra ? squadra.nome : 'Squadra sconosciuta';
  };

  const handleRicalcoloPunteggi = async () => {
    if (isRecalculating) return;
    
    setIsRecalculating(true);
    setError(null);
    setSuccess(null);
    
    try {
      console.log('Avvio ricalcolo punteggi...');
      const { error } = await ricalcolaPunteggiUtenti();
      
      if (error) {
        console.error('Errore durante il ricalcolo dei punteggi:', error);
        setError('Errore durante il ricalcolo dei punteggi');
      } else {
        console.log('Ricalcolo punteggi completato con successo');
        setSuccess('Ricalcolo punteggi completato con successo');
      }
    } catch (error) {
      console.error('Errore durante il ricalcolo dei punteggi:', error);
      setError('Errore durante il ricalcolo dei punteggi');
    } finally {
      setIsRecalculating(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="admin-page">
          <div className="loading">Caricamento...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="admin-page">
        <h1>Pannello di Amministrazione</h1>
        
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}
        
        <div className="admin-card">
          <h2>Azioni amministrative</h2>
          <div className="admin-actions">
            <button 
              className="recalculate-button" 
              onClick={handleRicalcoloPunteggi}
              disabled={isRecalculating}
            >
              {isRecalculating ? 'Ricalcolo in corso...' : 'Ricalcola tutti i punteggi'}
            </button>
            <p className="action-description">
              Questa azione ricalcolerà i punteggi di tutti i pronostici e aggiornerà la classifica generale.
              Utile se sono stati modificati manualmente dei risultati o se ci sono stati problemi con il calcolo automatico.
            </p>
          </div>
        </div>
        
        <div className="admin-tabs">
          <button 
            className={`tab-button ${activeTab === 'turni' ? 'active' : ''}`} 
            onClick={() => setActiveTab('turni')}
          >
            Gestione Turni
          </button>
          <button 
            className={`tab-button ${activeTab === 'partite' ? 'active' : ''}`} 
            onClick={() => setActiveTab('partite')}
          >
            Gestione Partite
          </button>
        </div>
        
        {activeTab === 'turni' && (
          <>
            <div className="admin-card">
              <h2>Crea un nuovo turno</h2>
              <form className="admin-form" onSubmit={handleTurnoSubmit}>
                <div className="form-group">
                  <label htmlFor="descrizione">Descrizione</label>
                  <input
                    type="text"
                    id="descrizione"
                    name="descrizione"
                    value={turnoFormData.descrizione}
                    onChange={handleTurnoChange}
                    placeholder="es. Giornata 1 - Serie A1"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="data_limite">Data limite per i pronostici</label>
                  <input
                    type="datetime-local"
                    id="data_limite"
                    name="data_limite"
                    value={turnoFormData.data_limite}
                    onChange={handleTurnoChange}
                  />
                </div>
                
                <button type="submit" className="admin-button">Crea turno</button>
              </form>
            </div>
            
            <div className="admin-card">
              <h2>Turni esistenti</h2>
              {turni.length === 0 ? (
                <div className="no-turni">Nessun turno trovato</div>
              ) : (
                <div className="turni-list">
                  {turni.map(turno => (
                    <div key={turno.id} className="turno-item">
                      <div className="turno-info">
                        <div className="turno-descrizione">{turno.descrizione}</div>
                        <div className="turno-data">
                          Data limite: {formatData(turno.data_limite)}
                        </div>
                      </div>
                      <div className="turno-actions">
                        <button 
                          className="delete-button" 
                          onClick={() => handleDeleteTurnoClick(turno.id)}
                        >
                          Elimina
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
        
        {activeTab === 'partite' && (
          <>
            <div className="admin-card">
              <h2>Seleziona un turno</h2>
              <div className="form-group">
                <select
                  id="turno_select"
                  value={selectedTurno}
                  onChange={handleTurnoSelect}
                >
                  <option value="">Seleziona un turno</option>
                  {turni.map(turno => (
                    <option key={turno.id} value={turno.id}>
                      {turno.descrizione} - {formatData(turno.data_limite)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {selectedTurno && (
              <div className="admin-card">
                <h2>Crea una nuova partita</h2>
                <form className="admin-form" onSubmit={handleCreatePartita}>
                  <div className="form-group">
                    <label htmlFor="squadra_casa_id">Squadra di casa</label>
                    <select
                      id="squadra_casa_id"
                      name="squadra_casa_id"
                      value={formData.squadra_casa_id}
                      onChange={handleChange}
                    >
                      <option value="">Seleziona una squadra</option>
                      {squadre.map(squadra => (
                        <option key={`casa-${squadra.id}`} value={squadra.id}>
                          {squadra.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="squadra_ospite_id">Squadra ospite</label>
                    <select
                      id="squadra_ospite_id"
                      name="squadra_ospite_id"
                      value={formData.squadra_ospite_id}
                      onChange={handleChange}
                    >
                      <option value="">Seleziona una squadra</option>
                      {squadre.map(squadra => (
                        <option key={`ospite-${squadra.id}`} value={squadra.id}>
                          {squadra.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="data">Data e ora</label>
                    <input
                      type="datetime-local"
                      id="data"
                      name="data"
                      value={formData.data}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="campionato">Campionato</label>
                    <select
                      id="campionato"
                      name="campionato"
                      value={formData.campionato}
                      onChange={handleChange}
                    >
                      <option value="Elite Maschile">Elite Maschile</option>
                      <option value="Elite Femminile">Elite Femminile</option>
                      <option value="Maschile">Maschile</option>
                      <option value="Femminile">Femminile</option>
                    </select>
                  </div>
                  
                  <button type="submit" className="admin-button">Crea partita</button>
                </form>
              </div>
            )}
            
            {selectedTurno && (
              <div className="admin-card">
                <h2>Partite esistenti</h2>
                {partite.length === 0 ? (
                  <div className="no-partite">Nessuna partita trovata per questo turno</div>
                ) : (
                  <div className="partite-list">
                    {partite.map(partita => (
                      <div className="partita-item" key={partita.id}>
                        <div className="partita-info">
                          <div className="partita-data">{formatData(partita.data)}</div>
                          <div className="partita-campionato">{partita.campionato || 'Non specificato'}</div>
                          <div className="partita-teams">
                            <span className="team-casa">{getNomeSquadra(partita.squadra_casa_id)}</span>
                            <span className="vs">VS</span>
                            <span className="team-ospite">{getNomeSquadra(partita.squadra_ospite_id)}</span>
                          </div>
                          <div className="partita-risultato">
                            {partita.risultato_casa !== null && partita.risultato_ospite !== null ? (
                              <span>Risultato: {partita.risultato_casa} - {partita.risultato_ospite}</span>
                            ) : (
                              <span>Risultato non ancora inserito</span>
                            )}
                          </div>
                        </div>
                        <div className="partita-actions">
                          <button 
                            className="edit-button" 
                            onClick={() => handleEditClick(partita)}
                          >
                            Aggiorna risultato
                          </button>
                          <button 
                            className="delete-button" 
                            onClick={() => handleDeleteClick(partita.id)}
                          >
                            Elimina
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
        
        {/* Modal di conferma eliminazione partita */}
        {deleteModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Conferma eliminazione</h3>
              <p>Sei sicuro di voler eliminare questa partita? Questa azione non può essere annullata.</p>
              <div className="modal-actions">
                <button className="cancel-button" onClick={handleCancelDelete}>Annulla</button>
                <button className="confirm-button" onClick={handleConfirmDelete}>Elimina</button>
              </div>
            </div>
          </div>
        )}
        
        {/* Modal di conferma eliminazione turno */}
        {deleteTurnoModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Conferma eliminazione</h3>
              <p>Sei sicuro di voler eliminare questo turno? Questa azione non può essere annullata.</p>
              <p>Nota: non è possibile eliminare un turno che contiene partite.</p>
              <div className="modal-actions">
                <button className="cancel-button" onClick={handleCancelDeleteTurno}>Annulla</button>
                <button className="confirm-button" onClick={handleConfirmDeleteTurno}>Elimina</button>
              </div>
            </div>
          </div>
        )}
        
        {/* Modal di modifica risultato */}
        {editModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Aggiorna risultato</h3>
              <p>Inserisci il risultato finale della partita:</p>
              <div className="risultato-form">
                <div className="form-group">
                  <label htmlFor="risultato_casa">Gol casa</label>
                  <input
                    type="number"
                    id="risultato_casa"
                    name="risultato_casa"
                    min="0"
                    value={risultatoForm.risultato_casa}
                    onChange={handleRisultatoChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="risultato_ospite">Gol ospite</label>
                  <input
                    type="number"
                    id="risultato_ospite"
                    name="risultato_ospite"
                    min="0"
                    value={risultatoForm.risultato_ospite}
                    onChange={handleRisultatoChange}
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button className="cancel-button" onClick={handleCancelEdit}>Annulla</button>
                <button className="confirm-button" onClick={handleConfirmEdit}>Salva</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminPage; 