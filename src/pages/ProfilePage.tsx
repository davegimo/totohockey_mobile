import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import supabase from '../services/supabase';
import Layout from '../components/Layout';
import '../styles/ProfilePage.css';

type ProfileData = {
  nome: string;
  cognome: string;
  email: string;
};

const ProfilePage = () => {
  const { session } = useSession();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData>({
    nome: '',
    cognome: '',
    email: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!session || !session.user) {
        navigate('/login');
        return;
      }

      try {
        setLoading(true);
        
        // Recupera il profilo dell'utente
        const { data, error } = await supabase
          .from('profiles')
          .select('nome, cognome, email')
          .eq('id', session.user.id)
          .single();
        
        if (error) {
          throw error;
        }
        
        if (data) {
          setProfile({
            nome: data.nome || '',
            cognome: data.cognome || '',
            email: data.email || session.user.email || ''
          });
        }
        
        setLoading(false);
      } catch (err: any) {
        console.error('Errore durante il recupero del profilo:', err);
        setError('Errore durante il recupero del profilo. Riprova più tardi.');
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [session, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session || !session.user) {
      setError('Utente non autenticato');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      // Aggiorna il profilo
      const { error } = await supabase
        .from('profiles')
        .update({
          nome: profile.nome,
          cognome: profile.cognome
        })
        .eq('id', session.user.id);
      
      if (error) {
        throw error;
      }
      
      setSuccess('Profilo aggiornato con successo!');
      setSaving(false);
    } catch (err: any) {
      console.error('Errore durante l\'aggiornamento del profilo:', err);
      setError('Errore durante l\'aggiornamento del profilo. Riprova più tardi.');
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="profile-page">
        <div className="profile-container">
          <h1>Il tuo profilo</h1>
          
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          
          {loading ? (
            <div className="loading">Caricamento profilo...</div>
          ) : (
            <form onSubmit={handleSubmit} className="profile-form">
              <div className="form-group">
                <label htmlFor="nome">Nome</label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={profile.nome}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="cognome">Cognome</label>
                <input
                  type="text"
                  id="cognome"
                  name="cognome"
                  value={profile.cognome}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={profile.email}
                  disabled
                  className="disabled-input"
                />
                <small className="input-help">L'email non può essere modificata</small>
              </div>
              
              <button 
                type="submit" 
                className="save-button"
                disabled={saving}
              >
                {saving ? 'Salvataggio in corso...' : 'Salva modifiche'}
              </button>
            </form>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage; 