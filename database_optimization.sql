-- Indici per ottimizzare le query
-- Indice sulla colonna partita_id della tabella pronostici
CREATE INDEX IF NOT EXISTS idx_pronostici_partita_id ON pronostici(partita_id);

-- Indice sulla colonna user_id della tabella pronostici
CREATE INDEX IF NOT EXISTS idx_pronostici_user_id ON pronostici(user_id);

-- Indice composto per ottimizzare le query che filtrano per partita_id e confrontano pronostico_casa e pronostico_ospite
CREATE INDEX IF NOT EXISTS idx_pronostici_partita_pronostico ON pronostici(partita_id, pronostico_casa, pronostico_ospite);

-- Indice sulla colonna punti della tabella pronostici
CREATE INDEX IF NOT EXISTS idx_pronostici_punti ON pronostici(punti);

-- Funzione per aggiornare i punti dei pronostici con risultato esatto (3 punti)
CREATE OR REPLACE FUNCTION aggiorna_punti_risultato_esatto(p_partita_id UUID, p_risultato_casa INTEGER, p_risultato_ospite INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE pronostici
  SET punti = 3
  WHERE partita_id = p_partita_id
    AND pronostico_casa = p_risultato_casa
    AND pronostico_ospite = p_risultato_ospite;
END;
$$ LANGUAGE plpgsql;

-- Funzione per aggiornare i punti dei pronostici con esito corretto (1 punto)
CREATE OR REPLACE FUNCTION aggiorna_punti_esito_corretto(p_partita_id UUID, p_risultato_casa INTEGER, p_risultato_ospite INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE pronostici
  SET punti = 1
  WHERE partita_id = p_partita_id
    AND punti <> 3  -- Esclude i pronostici già aggiornati con risultato esatto
    AND (
      -- Vittoria casa pronosticata e verificata
      (pronostico_casa > pronostico_ospite AND p_risultato_casa > p_risultato_ospite) OR
      -- Vittoria ospite pronosticata e verificata
      (pronostico_casa < pronostico_ospite AND p_risultato_casa < p_risultato_ospite) OR
      -- Pareggio pronosticato e verificato
      (pronostico_casa = pronostico_ospite AND p_risultato_casa = p_risultato_ospite)
    );
END;
$$ LANGUAGE plpgsql;

-- Funzione per aggiornare i punti dei pronostici con risultato sbagliato (0 punti)
CREATE OR REPLACE FUNCTION aggiorna_punti_risultato_sbagliato(p_partita_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE pronostici
  SET punti = 0
  WHERE partita_id = p_partita_id
    AND (punti IS NULL OR (punti <> 1 AND punti <> 3));
END;
$$ LANGUAGE plpgsql;

-- Funzione per aggiornare i punteggi totali degli utenti in modo massivo
CREATE OR REPLACE FUNCTION aggiorna_punteggi_utenti()
RETURNS void AS $$
BEGIN
  -- Aggiorna il punteggio di ogni utente con la somma dei punti dei suoi pronostici
  UPDATE profiles p
  SET punteggio = subquery.total_points
  FROM (
    SELECT user_id, COALESCE(SUM(punti), 0) as total_points
    FROM pronostici
    GROUP BY user_id
  ) AS subquery
  WHERE p.id = subquery.user_id;
END;
$$ LANGUAGE plpgsql;

-- Vista per la classifica che include risultati esatti e esiti corretti
CREATE OR REPLACE VIEW vista_classifica AS
SELECT 
  p.id as id_giocatore,
  p.nome,
  p.cognome,
  p.punteggio as punti_totali,
  COALESCE(exact_results.count, 0) as risultati_esatti,
  COALESCE(correct_outcomes.count, 0) as esiti_presi
FROM 
  profiles p
LEFT JOIN 
  (SELECT user_id, COUNT(*) as count FROM pronostici WHERE punti = 3 GROUP BY user_id) AS exact_results
  ON p.id = exact_results.user_id
LEFT JOIN 
  (SELECT user_id, COUNT(*) as count FROM pronostici WHERE punti = 1 GROUP BY user_id) AS correct_outcomes
  ON p.id = correct_outcomes.user_id
ORDER BY 
  p.punteggio DESC,
  exact_results.count DESC,
  correct_outcomes.count DESC; 