-- Questo script corregge il sistema di invito alle leghe

-- 1. Assicuriamoci che la colonna ultimo_invito esista nella tabella leghe
ALTER TABLE leghe
ADD COLUMN IF NOT EXISTS ultimo_invito TIMESTAMPTZ;

-- 2. Impostiamo valori di default per ultimo_invito per i record esistenti che non lo hanno
UPDATE leghe
SET ultimo_invito = data_creazione
WHERE ultimo_invito IS NULL;

-- 3. Correggiamo/creiamo la funzione per aggiornare l'ultimo_invito quando si genera un nuovo codice
CREATE OR REPLACE FUNCTION aggiorna_ultimo_invito()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo se il codice invito è cambiato, aggiorniamo l'ultimo_invito
    IF OLD.codice_invito IS DISTINCT FROM NEW.codice_invito THEN
        NEW.ultimo_invito = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Creiamo un trigger che chiama questa funzione al cambiamento del codice invito
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'aggiorna_ultimo_invito_trigger'
    ) THEN
        CREATE TRIGGER aggiorna_ultimo_invito_trigger
        BEFORE UPDATE ON leghe
        FOR EACH ROW
        EXECUTE FUNCTION aggiorna_ultimo_invito();
    END IF;
END $$;

-- 5. Creiamo anche un bucket di storage per i loghi se non esiste
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets
        WHERE name = 'loghi'
    ) THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('loghi', 'loghi', true);
        
        -- Impostiamo le policy di accesso al bucket
        -- Permesso di leggere file pubblici
        INSERT INTO storage.policies (name, definition, bucket_id)
        VALUES ('Read Files', '(bucket_id = ''loghi''::text)', 'loghi');
        
        -- Permesso di caricare file per utenti autenticati
        INSERT INTO storage.policies (name, definition, bucket_id, operation)
        VALUES ('Upload Files', '(bucket_id = ''loghi''::text AND auth.role() = ''authenticated'')', 'loghi', 'INSERT');
        
        -- Permesso di aggiornare i propri file
        INSERT INTO storage.policies (name, definition, bucket_id, operation)
        VALUES ('Update Own Files', '(bucket_id = ''loghi''::text AND auth.uid() = owner)', 'loghi', 'UPDATE');
        
        -- Permesso di eliminare i propri file
        INSERT INTO storage.policies (name, definition, bucket_id, operation)
        VALUES ('Delete Own Files', '(bucket_id = ''loghi''::text AND auth.uid() = owner)', 'loghi', 'DELETE');
    END IF;
END $$;

-- 6. Aggiorniamo la funzione invitaGiocatore e partecipaLega per gestire meglio gli inviti
CREATE OR REPLACE FUNCTION update_codice_invito_partecipazione()
RETURNS TRIGGER AS $$
BEGIN
    -- Quando un utente partecipa attraverso un codice invito, 
    -- aggiorniamo ultimo_invito per renderlo valido ancora per 12 ore
    UPDATE leghe
    SET ultimo_invito = NOW()
    WHERE id = NEW.lega_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crea un trigger per aggiornare ultimo_invito quando un utente partecipa alla lega
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_codice_invito_partecipazione_trigger'
    ) THEN
        CREATE TRIGGER update_codice_invito_partecipazione_trigger
        AFTER INSERT ON giocatori_leghe
        FOR EACH ROW
        EXECUTE FUNCTION update_codice_invito_partecipazione();
    END IF;
END $$;

-- Aggiungiamo una foreign key constraint per sicurezza
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints
        WHERE constraint_name = 'giocatori_leghe_lega_id_fkey'
    ) THEN
        ALTER TABLE giocatori_leghe
        ADD CONSTRAINT giocatori_leghe_lega_id_fkey
        FOREIGN KEY (lega_id) REFERENCES leghe(id) ON DELETE CASCADE;
    END IF;
END $$; 