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

-- Crea il tipo squadra se non esiste
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'squadra') THEN
    CREATE TYPE squadra AS ENUM ('Tevere', 'Amsicora', 'Ferrini', 'Tricolore', 'Bonomi', 'Valchisone', 'Cus Cagliari', 'Lazio');
  END IF;
END
$$;

-- Crea la tabella partite se non esiste
CREATE TABLE IF NOT EXISTS partite (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  squadraCasa squadra NOT NULL,
  squadraOspite squadra NOT NULL,
  data DATE NOT NULL,
  risultatoCasa INTEGER,
  risultatoOspite INTEGER
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
  userId UUID REFERENCES auth.users NOT NULL,
  partitaId UUID REFERENCES partite NOT NULL,
  pronosticoCasa INTEGER NOT NULL,
  pronosticoOspite INTEGER NOT NULL,
  punti INTEGER,
  UNIQUE (userId, partitaId)
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
    CREATE POLICY "Gli utenti possono inserire i propri pronostici" ON pronostici FOR INSERT WITH CHECK (auth.uid() = userId);
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'pronostici' AND policyname = 'Gli utenti possono aggiornare i propri pronostici'
  ) THEN
    CREATE POLICY "Gli utenti possono aggiornare i propri pronostici" ON pronostici FOR UPDATE USING (auth.uid() = userId);
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
INSERT INTO partite (squadraCasa, squadraOspite, data)
VALUES
  ('Tevere', 'Amsicora', CURRENT_DATE + INTERVAL '7 days'),
  ('Ferrini', 'Tricolore', CURRENT_DATE + INTERVAL '7 days'),
  ('Bonomi', 'Valchisone', CURRENT_DATE + INTERVAL '14 days'),
  ('Cus Cagliari', 'Lazio', CURRENT_DATE + INTERVAL '14 days')
ON CONFLICT DO NOTHING; 