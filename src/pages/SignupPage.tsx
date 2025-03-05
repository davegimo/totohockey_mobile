import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import supabase from '../services/supabase';
import Layout from '../components/Layout';
import '../styles/AuthPages.css';

const SignupPage = () => {
  const [nome, setNome] = useState('');
  const [cognome, setCognome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nome || !cognome || !email || !password) {
      setError('Compila tutti i campi');
      return;
    }
    
    if (password.length < 6) {
      setError('La password deve contenere almeno 6 caratteri');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome,
            cognome,
            punteggio: 0
          }
        }
      });
      
      if (error) {
        throw error;
      }
      
      // Registrazione riuscita, reindirizza alla pagina di login con messaggio
      navigate('/login', { 
        state: { 
          message: 'Registrazione completata! Controlla la tua email per confermare l\'account.' 
        } 
      });
    } catch (err: any) {
      console.error('Errore durante la registrazione:', err.message);
      setError(err.message === 'User already registered' 
        ? 'Email già registrata. Prova ad accedere.' 
        : 'Si è verificato un errore durante la registrazione. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="auth-page">
        <div className="auth-container">
          <h1>Registrati</h1>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="nome">Nome</label>
              <input
                type="text"
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Il tuo nome"
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="cognome">Cognome</label>
              <input
                type="text"
                id="cognome"
                value={cognome}
                onChange={(e) => setCognome(e.target.value)}
                placeholder="Il tuo cognome"
                disabled={loading}
              />
            </div>
            
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
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Scegli una password"
                disabled={loading}
              />
            </div>
            
            <button 
              type="submit" 
              className="auth-button"
              disabled={loading}
            >
              {loading ? 'Registrazione in corso...' : 'Registrati'}
            </button>
          </form>
          
          <div className="auth-links">
            <p>
              Hai già un account? <Link to="/login">Accedi</Link>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SignupPage; 