# Implementazione Funzionalità "Partecipa alla Lega"

## Riepilogo delle Modifiche

Questa implementazione consente agli utenti di partecipare a una lega utilizzando un codice di invito. Il flusso completo comprende:
1. Un bottone "Partecipa" nella pagina delle leghe
2. Una pagina dedicata per inserire il codice di invito
3. La visualizzazione dei dettagli della lega prima di confermare la partecipazione
4. Un modale di conferma per la partecipazione
5. Un messaggio di successo con reindirizzamento alla pagina delle leghe

## File Modificati

### 1. `src/router/index.tsx`
- Aggiunta la rotta `/partecipa` protetta da autenticazione per accedere alla pagina di partecipazione

### 2. `src/pages/LeghePage.tsx`
- Aggiunto un bottone "Partecipa" accanto al bottone "Crea Lega"
- Implementata la navigazione alla pagina di partecipazione con `replace: true` per evitare problemi di navigazione

### 3. `src/styles/LeghePage.css`
- Aggiunti stili per il nuovo bottone "Partecipa"
- Modificata la struttura del container dei bottoni per accomodare entrambi i bottoni

### 4. `src/pages/PartecipaPagina.tsx`
- Semplificata per implementare il nuovo flusso di partecipazione
- Rimossa la logica di accesso tramite link di invito
- Ora permette di:
  - Inserire manualmente un codice di invito
  - Visualizzare i dettagli della lega (nome, descrizione, data creazione, numero partecipanti)
  - Confermare la partecipazione tramite un modale
  - Ricevere feedback sul successo dell'operazione con reindirizzamento automatico

### 5. `src/styles/PartecipaPagina.css`
- Aggiunti stili per:
  - Form di ricerca lega
  - Card di visualizzazione dei dettagli lega
  - Modale di conferma
  - Messaggi di errore e successo
  - Responsività su dispositivi mobili

## Come Funziona

1. L'utente clicca su "Partecipa" nella pagina delle leghe
2. Viene reindirizzato alla pagina di partecipazione (con replace: true per evitare problemi di navigazione)
3. Inserisce il codice di invito e clicca su "Cerca"
4. Se il codice è valido, vengono mostrati i dettagli della lega
5. L'utente clicca su "Partecipa alla Lega"
6. Appare un modale di conferma
7. Dopo la conferma, l'utente viene aggiunto alla lega
8. Viene mostrato un messaggio di successo e l'utente viene reindirizzato alla pagina delle leghe dopo 5 secondi

## Controlli di Sicurezza

- Verifica dell'autenticazione dell'utente (tramite AuthProtectedRoute)
- Controllo della validità del codice di invito
- Verifica della scadenza del link di invito (12 ore)
- Prevenzione di partecipazioni multiple alla stessa lega

## Note Aggiuntive

- L'interfaccia è completamente responsiva
- Gli errori e i messaggi di successo sono chiaramente visibili all'utente
- Il reindirizzamento automatico alla pagina delle leghe dopo la partecipazione riuscita migliora l'esperienza utente
- Utilizzato `replace: true` nella navigazione per evitare problemi di ritorno alla dashboard principale 