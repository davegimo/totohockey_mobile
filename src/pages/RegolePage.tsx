import Layout from '../components/Layout';
import '../styles/RegolePage.css';

const RegolePage = () => {
  return (
    <Layout>
      <div className="regole-page">
        <h1>Regole del Gioco</h1>
        
        <section className="regole-intro">
          <p>
            Benvenuto a TotoHockey, il gioco di pronostici dedicato all'hockey su prato italiano!
            Qui troverai tutte le informazioni necessarie per partecipare e competere con gli altri appassionati.
          </p>
        </section>
        
        <section className="features">
          <h2>Come funziona</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📝</div>
              <h3>Pronostica</h3>
              <p>Inserisci i tuoi pronostici per le partite del weekend entro le 23:59 del venerdì precedente.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🏆</div>
              <h3>Guadagna punti</h3>
              <p>Ottieni 3 punti per il risultato esatto, 1 punto per l'esito corretto (vittoria, pareggio, sconfitta).</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Classifica</h3>
              <p>Confronta i tuoi risultati con quelli degli altri giocatori nella classifica aggiornata.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">⏱️</div>
              <h3>Tempistiche</h3>
              <p>I pronostici sono accettati fino all'inizio della partita. I risultati vengono aggiornati entro 24 ore.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🔄</div>
              <h3>Modifiche</h3>
              <p>Puoi modificare i tuoi pronostici fino all'inizio della partita, l'ultimo inserito sarà quello valido.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🏅</div>
              <h3>Premi stagionali</h3>
              <p>Alla fine della stagione, i primi tre classificati riceveranno un riconoscimento speciale.</p>
            </div>
          </div>
        </section>
        
        <section className="regole-dettagliate">
          <h2>Dettagli del punteggio</h2>
          <div className="regole-card">
            <h3>Sistema di punteggio</h3>
            <ul>
              <li><strong>3 punti</strong>: Risultato esatto (es. pronostico 2-1, risultato 2-1)</li>
              <li><strong>1 punto</strong>: Esito corretto ma risultato sbagliato (es. pronostico 2-1, risultato 3-1)</li>
              <li><strong>0 punti</strong>: Esito sbagliato (es. pronostico 2-1, risultato 1-2)</li>
            </ul>
          </div>
          
          <div className="regole-card">
            <h3>Partite annullate o rinviate</h3>
            <p>
              In caso di partite annullate o rinviate, i pronostici relativi non verranno considerati.
              Se la partita viene recuperata entro la fine della stagione, sarà possibile inserire nuovi pronostici.
            </p>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default RegolePage; 