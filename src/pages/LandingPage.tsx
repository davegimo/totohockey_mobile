import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import '../styles/LandingPage.css';

const LandingPage = () => {
  return (
    <Layout>
      <div className="landing-page">
        <section className="hero">
          <div className="hero-content">
            <h1>Benvenuto su TotoHockey</h1>
            <p className="hero-subtitle">
              Pronostica i risultati delle partite di hockey su prato e sfida i tuoi amici!
            </p>
            <div className="hero-buttons">
              <Link to="/login" className="button login-btn">Accedi</Link>
              <Link to="/signup" className="button signup-btn">Registrati</Link>
            </div>
          </div>
        </section>
        
        <section className="features">
          <h2>Come funziona</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📝</div>
              <h3>Pronostica</h3>
              <p>Inserisci i tuoi pronostici per le partite del weekend</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🏆</div>
              <h3>Guadagna punti</h3>
              <p>Ottieni punti per ogni pronostico corretto</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Classifica</h3>
              <p>Confronta i tuoi risultati con quelli degli altri giocatori</p>
            </div>
          </div>
        </section>
        
        <section className="teams">
          <h2>Le squadre</h2>
          <div className="teams-grid">
            {['Tevere', 'Amsicora', 'Ferrini', 'Tricolore', 'Bonomi', 'Valchisone', 'Cus Cagliari', 'Lazio'].map((team) => (
              <div key={team} className="team-card">
                <div className="team-name">{team}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default LandingPage; 