import { useState } from 'react';
import { Link } from 'react-router-dom';
import supabase from '../services/supabase';
import Layout from '../components/Layout';
import '../styles/AuthPages.css';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Inserisci la tua email');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Invia email per il reset della password
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        throw error;
      }
      
      // Mostra messaggio di successo
      setSuccessMessage('Ti abbiamo inviato un\'email con le istruzioni per reimpostare la password.');
      
      // Pulisci il campo email
      setEmail('');
    } catch (err: any) {
      console.error('Errore durante la richiesta di reset della password:', err.message);
      setError('Si è verificato un errore durante l\'invio dell\'email. Verifica che l\'indirizzo sia corretto e riprova.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="auth-page">
        <div className="auth-container">
          <h1>Password dimenticata?</h1>
          <p className="auth-subtitle">Inserisci la tua email e ti invieremo un link per reimpostare la password.</p>
          
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
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="La tua email"
                disabled={loading}
              />
            </div>
            
            <button 
              type="submit" 
              className="auth-button"
              disabled={loading}
            >
              {loading ? 'Invio in corso...' : 'Invia link di reset'}
            </button>
          </form>
          
          <div className="auth-links">
            <p>
              <Link to="/login">Torna al login</Link>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ForgotPasswordPage; 