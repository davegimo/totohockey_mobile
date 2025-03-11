-- Aggiungi le colonne risultati_esatti e esiti_presi alla tabella profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS risultati_esatti INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS esiti_presi INTEGER DEFAULT 0;

-- Aggiorna i valori iniziali delle nuove colonne
UPDATE profiles p
SET 
  risultati_esatti = COALESCE(exact_results.count, 0),
  esiti_presi = COALESCE(correct_outcomes.count, 0)
FROM 
  (SELECT user_id, COUNT(*) as count FROM pronostici WHERE punti = 3 GROUP BY user_id) AS exact_results,
  (SELECT user_id, COUNT(*) as count FROM pronostici WHERE punti = 1 GROUP BY user_id) AS correct_outcomes
WHERE 
  p.id = exact_results.user_id AND
  p.id = correct_outcomes.user_id;

-- Aggiorna la funzione per includere l'aggiornamento delle nuove colonne
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
  
  -- Aggiorna anche i conteggi di risultati esatti e esiti corretti
  UPDATE profiles p
  SET 
    risultati_esatti = exact_results.count,
    esiti_presi = correct_outcomes.count
  FROM 
    (SELECT user_id, COUNT(*) as count FROM pronostici WHERE punti = 3 GROUP BY user_id) AS exact_results,
    (SELECT user_id, COUNT(*) as count FROM pronostici WHERE punti = 1 GROUP BY user_id) AS correct_outcomes
  WHERE 
    p.id = exact_results.user_id AND
    p.id = correct_outcomes.user_id;
END;
$$ LANGUAGE plpgsql; 