-- Aggiungi la colonna campionato alla tabella partite con valore predefinito 'Elite Maschile'
ALTER TABLE partite ADD COLUMN campionato TEXT DEFAULT 'Elite Maschile';

-- Aggiorna le partite esistenti impostando il campionato a 'Elite Maschile'
UPDATE partite SET campionato = 'Elite Maschile' WHERE campionato IS NULL;

-- Crea un indice sulla colonna campionato per migliorare le prestazioni delle query
CREATE INDEX idx_partite_campionato ON partite(campionato);

-- Esempio di query per selezionare le partite di un determinato campionato
-- SELECT * FROM partite WHERE campionato = 'Elite Maschile';
-- SELECT * FROM partite WHERE campionato = 'Elite Femminile';

-- Esempio di query per contare le partite per campionato
-- SELECT campionato, COUNT(*) FROM partite GROUP BY campionato;
