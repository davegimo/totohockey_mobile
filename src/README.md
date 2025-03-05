# Note di sviluppo

## Problema con l'eliminazione delle partite

Se l'eliminazione delle partite non funziona correttamente, potrebbe essere dovuto a uno dei seguenti problemi:

1. **Policy di sicurezza Supabase**: Verifica che la policy RLS (Row Level Security) per la tabella `partite` consenta l'eliminazione da parte degli utenti admin:

```sql
-- Aggiungi questa policy se non esiste già
create policy "Gli admin possono eliminare partite" on partite for delete using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid() and profiles.ruolo = 'admin'
  )
);
```

2. **Policy per i pronostici**: Verifica che sia possibile eliminare i pronostici associati a una partita:

```sql
-- Aggiungi questa policy se non esiste già
create policy "Gli admin possono eliminare pronostici" on pronostici for delete using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid() and profiles.ruolo = 'admin'
  )
);
```

3. **Vincoli di integrità referenziale**: Se ci sono altre tabelle che fanno riferimento alla tabella `partite`, potrebbe essere necessario eliminare prima quei record o configurare l'eliminazione a cascata.

4. **Verifica dei log**: Controlla i log della console del browser per vedere se ci sono errori durante l'eliminazione.

5. **Aggiornamento dell'interfaccia**: Verifica che la funzione `fetchPartite()` venga chiamata correttamente dopo l'eliminazione e che l'interfaccia si aggiorni.

## Soluzione temporanea

Se l'eliminazione non funziona tramite l'interfaccia, puoi eseguire manualmente questa query SQL nell'interfaccia di Supabase:

```sql
-- Elimina i pronostici associati alla partita
DELETE FROM pronostici WHERE partita_id = 'id-della-partita';

-- Elimina la partita
DELETE FROM partite WHERE id = 'id-della-partita';
``` 