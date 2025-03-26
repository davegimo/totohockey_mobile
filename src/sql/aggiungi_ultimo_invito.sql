-- Script per aggiungere la colonna ultimo_invito alla tabella leghe

-- Verifica se la colonna ultimo_invito esiste già nella tabella leghe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'leghe'
        AND column_name = 'ultimo_invito'
    ) THEN
        -- Aggiungi la colonna ultimo_invito come timestamp
        ALTER TABLE leghe ADD COLUMN ultimo_invito TIMESTAMP WITH TIME ZONE;
    END IF;
END
$$;

-- Aggiorna la funzione di generazione del codice di invito per includere la data dell'invito
CREATE OR REPLACE FUNCTION generate_codice_invito()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_pubblica = FALSE AND NEW.codice_invito IS NULL THEN
        NEW.codice_invito := UPPER(SUBSTRING(MD5(NEW.id::text || NOW()::text) FROM 1 FOR 8));
        NEW.ultimo_invito := NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql; 