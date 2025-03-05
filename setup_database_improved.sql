-- Crea la tabella profiles se non esiste
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  nome TEXT,
  cognome TEXT,
  email TEXT,
  punteggio INTEGER DEFAULT 0
);

-- Abilita Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Crea le policy per la tabella profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Gli utenti possono vedere tutti i profili'
  ) THEN
    CREATE POLICY "Gli utenti possono vedere tutti i profili" ON profiles FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Gli utenti possono aggiornare il proprio profilo'
  ) THEN
    CREATE POLICY "Gli utenti possono aggiornare il proprio profilo" ON profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
END
$$;

-- Crea la tabella squadre se non esiste
CREATE TABLE IF NOT EXISTS squadre (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  descrizione TEXT
);

-- Abilita Row Level Security
ALTER TABLE squadre ENABLE ROW LEVEL SECURITY;

-- Crea le policy per la tabella squadre
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'squadre' AND policyname = 'Tutti possono vedere le squadre'
  ) THEN
    CREATE POLICY "Tutti possono vedere le squadre" ON squadre FOR SELECT USING (true);
  END IF;
END
$$;

-- Inserisci le squadre se non esistono già
INSERT INTO squadre (nome, logo_url, descrizione)
VALUES
  ('Tevere', NULL, 'Squadra di hockey su prato Tevere'),
  ('Amsicora', NULL, 'Squadra di hockey su prato Amsicora'),
  ('Ferrini', NULL, 'Squadra di hockey su prato Ferrini'),
  ('Tricolore', NULL, 'Squadra di hockey su prato Tricolore'),
  ('Bonomi', NULL, 'Squadra di hockey su prato Bonomi'),
  ('Valchisone', NULL, 'Squadra di hockey su prato Valchisone'),
  ('Cus Cagliari', NULL, 'Squadra di hockey su prato Cus Cagliari'),
  ('Lazio', NULL, 'Squadra di hockey su prato Lazio')
ON CONFLICT (nome) DO NOTHING;

-- Crea la tabella partite se non esiste
CREATE TABLE IF NOT EXISTS partite (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  squadra_casa_id INTEGER REFERENCES squadre(id) NOT NULL,
  squadra_ospite_id INTEGER REFERENCES squadre(id) NOT NULL,
  data DATE NOT NULL,
  risultato_casa INTEGER,
  risultato_ospite INTEGER
);

-- Abilita Row Level Security
ALTER TABLE partite ENABLE ROW LEVEL SECURITY;

-- Crea le policy per la tabella partite
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'partite' AND policyname = 'Tutti possono vedere le partite'
  ) THEN
    CREATE POLICY "Tutti possono vedere le partite" ON partite FOR SELECT USING (true);
  END IF;
END
$$;

-- Crea la tabella pronostici se non esiste
CREATE TABLE IF NOT EXISTS pronostici (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  partita_id UUID REFERENCES partite(id) NOT NULL,
  pronostico_casa INTEGER NOT NULL,
  pronostico_ospite INTEGER NOT NULL,
  punti INTEGER,
  UNIQUE (user_id, partita_id)
);

-- Abilita Row Level Security
ALTER TABLE pronostici ENABLE ROW LEVEL SECURITY;

-- Crea le policy per la tabella pronostici
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'pronostici' AND policyname = 'Gli utenti possono vedere tutti i pronostici'
  ) THEN
    CREATE POLICY "Gli utenti possono vedere tutti i pronostici" ON pronostici FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'pronostici' AND policyname = 'Gli utenti possono inserire i propri pronostici'
  ) THEN
    CREATE POLICY "Gli utenti possono inserire i propri pronostici" ON pronostici FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'pronostici' AND policyname = 'Gli utenti possono aggiornare i propri pronostici'
  ) THEN
    CREATE POLICY "Gli utenti possono aggiornare i propri pronostici" ON pronostici FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Crea la funzione e il trigger per la creazione automatica del profilo
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nome, cognome, punteggio)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'nome', new.raw_user_meta_data->>'cognome', 0);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crea il trigger se non esiste
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
  END IF;
END
$$;

-- Inserisci alcune partite di esempio
DO $$
DECLARE
  tevere_id INTEGER;
  amsicora_id INTEGER;
  ferrini_id INTEGER;
  tricolore_id INTEGER;
  bonomi_id INTEGER;
  valchisone_id INTEGER;
  cus_cagliari_id INTEGER;
  lazio_id INTEGER;
BEGIN
  -- Ottieni gli ID delle squadre
  SELECT id INTO tevere_id FROM squadre WHERE nome = 'Tevere';
  SELECT id INTO amsicora_id FROM squadre WHERE nome = 'Amsicora';
  SELECT id INTO ferrini_id FROM squadre WHERE nome = 'Ferrini';
  SELECT id INTO tricolore_id FROM squadre WHERE nome = 'Tricolore';
  SELECT id INTO bonomi_id FROM squadre WHERE nome = 'Bonomi';
  SELECT id INTO valchisone_id FROM squadre WHERE nome = 'Valchisone';
  SELECT id INTO cus_cagliari_id FROM squadre WHERE nome = 'Cus Cagliari';
  SELECT id INTO lazio_id FROM squadre WHERE nome = 'Lazio';
  
  -- Inserisci le partite
  INSERT INTO partite (squadra_casa_id, squadra_ospite_id, data)
  VALUES
    (tevere_id, amsicora_id, CURRENT_DATE + INTERVAL '7 days'),
    (ferrini_id, tricolore_id, CURRENT_DATE + INTERVAL '7 days'),
    (bonomi_id, valchisone_id, CURRENT_DATE + INTERVAL '14 days'),
    (cus_cagliari_id, lazio_id, CURRENT_DATE + INTERVAL '14 days')
  ON CONFLICT DO NOTHING;
END
$$; 