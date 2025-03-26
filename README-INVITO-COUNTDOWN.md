# Implementazione Modale Invito con Countdown

## Panoramica

Questo documento descrive le modifiche apportate per implementare un modale di invito giocatori con le seguenti funzionalità:
- Visualizzazione del codice di invito come URL 
- Countdown per la scadenza del link (12 ore dopo l'ultimo invito)
- Possibilità di copiare il link con un pulsante
- Funzionalità per rigenerare il link di invito

## Componenti Modificati

### 1. Tipo `Lega` in `supabase.ts`
- Aggiunto `ultimo_invito?: string | null` alla definizione del tipo
- Modificato da `type` a `interface` per maggiore chiarezza

### 2. Funzione `rigeneraLinkInvito` in `supabase.ts`
- Implementata nuova funzione che:
  - Verifica i permessi dell'utente (deve essere admin)
  - Genera un nuovo codice casuale
  - Aggiorna la lega con il nuovo codice e la data di ultimo invito
  - Restituisce il risultato con il nuovo codice

### 3. Componente `InvitoModal` in `InvitoModal.tsx`
- Aggiunto parametro `ultimoInvito` alle props
- Implementato countdown visivo in real-time
- Aggiunto display del tempo rimanente in formato ore:minuti:secondi
- Migliorata UI con area countdown ben definita
- Aggiunto pulsante di rigenerazione sempre visibile anche quando il link è ancora valido
- Gestito caso di link scaduto o non presente

### 4. Stili in `InvitoModal.css`
- Aggiunti stili per il container del countdown
- Stilizzato il timer con font monospace e sfondo scuro
- Aggiunto stile per il pulsante secondario di rigenerazione nel countdown
- Migliorata la responsività dell'interfaccia

### 5. Componente `LegaPage` in `LegaPage.tsx`
- Aggiunta logica per aprire/chiudere il modale
- Implementata funzionalità di verifica della scadenza del link
- Aggiunta gestione della rigenerazione del link
- Collegamento con il modale di invito
- Aggiornamento dello stato della lega dopo la rigenerazione

## Come Funziona

1. Quando un utente amministratore clicca su "Invita Giocatori" nella pagina della lega, si apre il modale
2. Il modale mostra:
   - Se il link è valido: URL dell'invito, countdown per la scadenza, e pulsanti per copiare e rigenerare
   - Se il link è scaduto: messaggio di avviso e pulsante per rigenerare il link
   - Se non esiste un codice: messaggio e pulsante per generare il link

3. Il countdown si aggiorna in tempo reale, mostrando ore, minuti e secondi rimanenti
4. L'utente può copiare facilmente il link con un click e ricevere feedback visivo dell'azione

## Note Tecniche

- Il countdown viene aggiornato ogni secondo tramite `setInterval`
- La scadenza viene calcolata basandosi sul campo `ultimo_invito` + 12 ore
- La rigenerazione del link aggiorna il campo `ultimo_invito` nel database
- Il timer viene automaticamente dismesso quando il componente viene smontato

## Test

Per testare questa funzionalità:
1. Accedi a una lega come amministratore
2. Clicca sul pulsante "Invita Giocatori"
3. Verifica che il countdown funzioni e che il link possa essere copiato
4. Prova a rigenerare il link e controlla che venga aggiornato 