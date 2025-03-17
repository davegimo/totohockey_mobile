import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../services/supabase';
import Layout from '../components/Layout';
import '../styles/AuthPages.css';

const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  // Verifica che l'utente sia arrivato qui da un link di reset valido
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      
      if (!data.session) {
        setError('Il link per reimpostare la password non è valido o è scaduto.');
      }
    };
    
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      setError('Compila tutti i campi');
      return;
    }
    
    if (password.length < 6) {
      setError('La password deve contenere almeno 6 caratteri');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Le password non coincidono');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Imposta la nuova password
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      
      if (error) {
        throw error;
      }
      
      // Mostra messaggio di successo e reindirizza al login dopo un breve ritardo
      setSuccessMessage('Password reimpostata con successo!');
      
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Password reimpostata con successo! Puoi ora accedere con la nuova password.' 
          } 
        });
      }, 2000);
    } catch (err: any) {
      console.error('Errore durante la reimpostazione della password:', err.message);
      setError('Si è verificato un errore durante la reimpostazione della password. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="auth-page">
        <div className="auth-container">
          <h1>Reimposta la password</h1>
          
          {successMessage && (
            <div className="success-message">
              {successMessage}
            </div>
          )}
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="password">Nuova Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Scegli una nuova password"
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Conferma Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ripeti la password"
                disabled={loading}
              />
            </div>
            
            <button 
              type="submit" 
              className="auth-button"
              disabled={loading}
            >
              {loading ? 'Salvataggio in corso...' : 'Reimposta Password'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default ResetPasswordPage; 