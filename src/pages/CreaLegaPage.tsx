import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import CreaLegaModal from '../components/CreaLegaModal';
import { creaLega } from '../services/supabase';
import '../styles/CreaLegaPage.css';

const CreaLegaPage = () => {
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [descrizione, setDescrizione] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [anteprima, setAnteprima] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [legaCreata, setLegaCreata] = useState<{nome: string, id: string} | null>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files ? e.target.files[0] : null;
    
    if (selectedFile) {
      // Validazione del tipo di file (solo immagini)
      if (!selectedFile.type.match('image.*')) {
        setError('Per favore, seleziona un file immagine (jpg, png, gif)');
        setFile(null);
        setAnteprima(null);
        return;
      }
      
      // Validazione della dimensione del file (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('L\'immagine selezionata è troppo grande. La dimensione massima è 5MB.');
        setFile(null);
        setAnteprima(null);
        return;
      }
      
      setFile(selectedFile);
      
      // Crea un URL per l'anteprima dell'immagine
      const reader = new FileReader();
      reader.onload = (e) => {
        setAnteprima(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
      
      setError(null);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nome) {
      setError('Inserisci un nome per la lega');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Crea la lega utilizzando il servizio Supabase
      const { lega, error: legaError } = await creaLega(
        nome,
        descrizione,
        file || undefined,
        false // per ora creiamo solo leghe private
      );
      
      if (legaError) {
        throw legaError;
      }
      
      if (!lega) {
        throw new Error('Errore durante la creazione della lega');
      }
      
      // Salva le informazioni della lega creata e mostra il modal di successo
      setLegaCreata({
        nome: lega.nome,
        id: lega.id
      });
      setShowSuccessModal(true);
      
    } catch (err: any) {
      console.error('Errore durante la creazione della lega:', err);
      setError(err.message || 'Si è verificato un errore durante la creazione della lega');
      setLoading(false);
    }
  };
  
  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    navigate('/leghe');
  };

  return (
    <Layout>
      <div className="crea-lega-page">
        <h1 className="pagina-titolo">Crea Nuova Lega</h1>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <form className="crea-lega-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="nome">Nome Lega *</label>
            <input
              type="text"
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Inserisci il nome della lega"
              required
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="descrizione">Descrizione</label>
            <textarea
              id="descrizione"
              value={descrizione}
              onChange={(e) => setDescrizione(e.target.value)}
              placeholder="Descrivi brevemente la tua lega"
              rows={4}
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="foto">Logo della Lega</label>
            <input
              type="file"
              id="foto"
              accept="image/*"
              onChange={handleFileChange}
              disabled={loading}
            />
            <div className="file-info">
              Formati accettati: JPG, PNG, GIF. Dimensione massima: 5MB
            </div>
            
            {anteprima && (
              <div className="image-preview">
                <img src={anteprima} alt="Anteprima logo" />
              </div>
            )}
          </div>
          
          <div className="form-actions">
            <button 
              type="submit" 
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'Creazione in corso...' : 'Crea Lega'}
            </button>
          </div>
        </form>
        
        {/* Modal di successo */}
        <CreaLegaModal 
          isOpen={showSuccessModal}
          onClose={handleSuccessModalClose}
          title="Lega Creata con Successo"
          confirmText="OK"
        >
          <div className="success-modal-content">
            <p>
              Congratulazioni! La tua lega <strong>{legaCreata?.nome}</strong> è stata creata con successo.
            </p>
            <p>
              Ora puoi invitare i tuoi amici a partecipare e iniziare a competere.
            </p>
          </div>
        </CreaLegaModal>
      </div>
    </Layout>
  );
};

export default CreaLegaPage; 