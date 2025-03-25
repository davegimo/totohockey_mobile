-- Script per correggere la policy con ricorsione infinita

-- Elimina la policy problematica se esiste
DROP POLICY IF EXISTS read_giocatori_leghe ON giocatori_leghe;

-- Crea una vista materializzata per memorizzare le leghe a cui appartiene un utente
-- Questa evita il problema della ricorsione
CREATE MATERIALIZED VIEW IF NOT EXISTS leghe_utente AS
SELECT DISTINCT giocatore_id, lega_id
FROM giocatori_leghe;

-- Crea un indice sulla vista materializzata per ottimizzare le query
CREATE INDEX IF NOT EXISTS idx_leghe_utente_giocatore ON leghe_utente(giocatore_id);

-- Crea una funzione per aggiornare la vista materializzata
CREATE OR REPLACE FUNCTION refresh_leghe_utente()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW leghe_utente;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Crea un trigger per aggiornare la vista materializzata quando la tabella giocatori_leghe cambia
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_refresh_leghe_utente') THEN
        CREATE TRIGGER trigger_refresh_leghe_utente
        AFTER INSERT OR UPDATE OR DELETE ON giocatori_leghe
        FOR EACH STATEMENT
        EXECUTE FUNCTION refresh_leghe_utente();
    END IF;
END
$$;

-- Aggiorna la vista materializzata
REFRESH MATERIALIZED VIEW leghe_utente;

-- Crea una nuova policy che utilizza la vista materializzata invece di fare ricorsione
CREATE POLICY read_giocatori_leghe
ON giocatori_leghe
FOR SELECT
USING (
    giocatore_id = auth.uid() OR
    lega_id IN (
        SELECT lega_id FROM leghe_utente WHERE giocatore_id = auth.uid()
    )
);

-- Alternativa: crea una policy semplificata che consente l'accesso completo a giocatori_leghe
-- Usare questa soluzione temporanea se la precedente non risolve il problema
/*
DROP POLICY IF EXISTS read_giocatori_leghe ON giocatori_leghe;

CREATE POLICY read_giocatori_leghe
ON giocatori_leghe
FOR SELECT
USING (true);
*/ 