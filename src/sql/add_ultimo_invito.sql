-- Aggiungi la colonna ultimo_invito alla tabella leghe
ALTER TABLE leghe
ADD COLUMN IF NOT EXISTS ultimo_invito TIMESTAMPTZ;

-- Aggiorna la funzione che genera il codice di invito
CREATE OR REPLACE FUNCTION genera_codice_invito()
RETURNS TRIGGER AS $$
BEGIN
    -- Genera un codice di invito casuale di 8 caratteri
    NEW.codice_invito = UPPER(SUBSTRING(MD5(NEW.id || RANDOM()::TEXT) FROM 1 FOR 8));
    -- Imposta il timestamp dell'ultimo invito
    NEW.ultimo_invito = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crea un trigger se non esiste già
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'genera_codice_invito_trigger'
    ) THEN
        CREATE TRIGGER genera_codice_invito_trigger
        BEFORE INSERT ON leghe
        FOR EACH ROW
        EXECUTE FUNCTION genera_codice_invito();
    END IF;
END $$;

-- Aggiungi commenti per documentazione
COMMENT ON COLUMN leghe.ultimo_invito IS 'Timestamp dell''ultimo invito generato'; 