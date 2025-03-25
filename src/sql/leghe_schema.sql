-- Schema per le tabelle delle leghe

-- Tabella leghe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_tables WHERE schemaname = 'public' AND tablename = 'leghe') THEN
        CREATE TABLE leghe (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            nome VARCHAR(100) NOT NULL,
            descrizione TEXT,
            is_pubblica BOOLEAN DEFAULT FALSE,
            creato_da UUID REFERENCES auth.users(id) NOT NULL,
            logo_url TEXT,
            data_creazione TIMESTAMP WITH TIME ZONE DEFAULT now(),
            ultima_modifica TIMESTAMP WITH TIME ZONE DEFAULT now(),
            codice_invito VARCHAR(20) UNIQUE,
            attiva BOOLEAN DEFAULT TRUE
        );
        
        -- Indici per la tabella leghe
        CREATE INDEX idx_leghe_creato_da ON leghe(creato_da);
    END IF;
END
$$;

-- Trigger per generare automaticamente un codice di invito univoco per le leghe private
CREATE OR REPLACE FUNCTION generate_codice_invito()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_pubblica = FALSE AND NEW.codice_invito IS NULL THEN
        NEW.codice_invito := UPPER(SUBSTRING(MD5(NEW.id::text || NOW()::text) FROM 1 FOR 8));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_codice_invito') THEN
        CREATE TRIGGER trigger_codice_invito
        BEFORE INSERT ON leghe
        FOR EACH ROW
        EXECUTE FUNCTION generate_codice_invito();
    END IF;
END
$$;

-- Tabella legami tra giocatori e leghe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_tables WHERE schemaname = 'public' AND tablename = 'giocatori_leghe') THEN
        CREATE TABLE giocatori_leghe (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            giocatore_id UUID REFERENCES auth.users(id) NOT NULL,
            lega_id UUID REFERENCES leghe(id) NOT NULL,
            punti_totali INTEGER DEFAULT 0,
            risultati_esatti INTEGER DEFAULT 0,
            esiti_presi INTEGER DEFAULT 0,
            data_ingresso TIMESTAMP WITH TIME ZONE DEFAULT now(),
            is_admin BOOLEAN DEFAULT FALSE,
            ultima_modifica TIMESTAMP WITH TIME ZONE DEFAULT now(),
            UNIQUE(giocatore_id, lega_id)
        );
        
        -- Indici per la tabella giocatori_leghe
        CREATE INDEX idx_giocatori_leghe_giocatore ON giocatori_leghe(giocatore_id);
        CREATE INDEX idx_giocatori_leghe_lega ON giocatori_leghe(lega_id);
        CREATE INDEX idx_giocatori_leghe_punti ON giocatori_leghe(punti_totali DESC);
    END IF;
END
$$;

-- Vista per la classifica dei giocatori per lega
CREATE OR REPLACE VIEW vista_classifica_leghe AS
SELECT 
    gl.id,
    gl.giocatore_id,
    gl.lega_id,
    l.nome AS nome_lega,
    p.nome,
    p.cognome,
    gl.punti_totali,
    gl.risultati_esatti,
    gl.esiti_presi,
    gl.is_admin,
    gl.data_ingresso,
    l.is_pubblica,
    ROW_NUMBER() OVER (PARTITION BY gl.lega_id ORDER BY 
        gl.punti_totali DESC, 
        gl.risultati_esatti DESC, 
        gl.esiti_presi DESC
    ) AS posizione
FROM 
    giocatori_leghe gl
JOIN 
    leghe l ON gl.lega_id = l.id
JOIN 
    profiles p ON gl.giocatore_id = p.id
WHERE 
    l.attiva = TRUE;

-- Funzione per aggiornare i punteggi nella tabella giocatori_leghe
CREATE OR REPLACE FUNCTION update_giocatori_leghe_punti()
RETURNS TRIGGER AS $$
BEGIN
    -- Aggiorna l'ultima modifica
    NEW.ultima_modifica := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_giocatori_leghe') THEN
        CREATE TRIGGER trigger_update_giocatori_leghe
        BEFORE UPDATE OF punti_totali, risultati_esatti, esiti_presi ON giocatori_leghe
        FOR EACH ROW
        EXECUTE FUNCTION update_giocatori_leghe_punti();
    END IF;
END
$$;

-- RLS (Row Level Security) policies
-- Le policy di sicurezza permettono di proteggere i dati in base all'utente

-- Garantisci che RLS sia abilitato per entrambe le tabelle
ALTER TABLE leghe ENABLE ROW LEVEL SECURITY;
ALTER TABLE giocatori_leghe ENABLE ROW LEVEL SECURITY;

-- Funzione per verificare se esiste una policy su una tabella
CREATE OR REPLACE FUNCTION policy_exists(policy_name text, table_name text) RETURNS boolean AS $$
DECLARE
    exists_val boolean;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM pg_policies 
        WHERE policyname = policy_name 
        AND tablename = table_name
    ) INTO exists_val;
    RETURN exists_val;
END;
$$ LANGUAGE plpgsql;

-- Applica le policy solo se non esistono già
DO $$
BEGIN
    -- Leghe policies
    IF NOT policy_exists('read_public_leghe', 'leghe') THEN
        CREATE POLICY read_public_leghe
            ON leghe
            FOR SELECT
            USING (is_pubblica = TRUE OR creato_da = auth.uid());
    END IF;

    IF NOT policy_exists('insert_leghe', 'leghe') THEN
        CREATE POLICY insert_leghe
            ON leghe
            FOR INSERT
            WITH CHECK (auth.uid() IS NOT NULL);
    END IF;

    IF NOT policy_exists('update_own_leghe', 'leghe') THEN
        CREATE POLICY update_own_leghe
            ON leghe
            FOR UPDATE
            USING (creato_da = auth.uid());
    END IF;

    IF NOT policy_exists('delete_own_leghe', 'leghe') THEN
        CREATE POLICY delete_own_leghe
            ON leghe
            FOR DELETE
            USING (creato_da = auth.uid());
    END IF;

    -- Giocatori_leghe policies
    IF NOT policy_exists('read_giocatori_leghe', 'giocatori_leghe') THEN
        CREATE POLICY read_giocatori_leghe
            ON giocatori_leghe
            FOR SELECT
            USING (
                giocatore_id = auth.uid() OR
                lega_id IN (
                    SELECT lega_id FROM giocatori_leghe WHERE giocatore_id = auth.uid()
                )
            );
    END IF;

    IF NOT policy_exists('insert_giocatori_leghe', 'giocatori_leghe') THEN
        CREATE POLICY insert_giocatori_leghe
            ON giocatori_leghe
            FOR INSERT
            WITH CHECK (
                giocatore_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM leghe 
                    WHERE id = lega_id AND creato_da = auth.uid()
                )
            );
    END IF;

    IF NOT policy_exists('update_giocatori_leghe', 'giocatori_leghe') THEN
        CREATE POLICY update_giocatori_leghe
            ON giocatori_leghe
            FOR UPDATE
            USING (
                giocatore_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM giocatori_leghe 
                    WHERE giocatore_id = auth.uid() 
                    AND lega_id = giocatori_leghe.lega_id 
                    AND is_admin = TRUE
                )
            );
    END IF;
END
$$;

-- Inserire automaticamente il creatore della lega come admin nella tabella giocatori_leghe
CREATE OR REPLACE FUNCTION add_lega_creator_as_admin()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO giocatori_leghe (giocatore_id, lega_id, is_admin)
    VALUES (NEW.creato_da, NEW.id, TRUE);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_add_lega_creator') THEN
        CREATE TRIGGER trigger_add_lega_creator
        AFTER INSERT ON leghe
        FOR EACH ROW
        EXECUTE FUNCTION add_lega_creator_as_admin();
    END IF;
END
$$; 