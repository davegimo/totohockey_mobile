# TotoHockey

Un'applicazione per pronosticare i risultati delle partite di hockey su prato e sfidare i tuoi amici!

## Caratteristiche

- Autenticazione utente (registrazione e login)
- Visualizzazione delle prossime partite
- Inserimento dei pronostici
- Classifica dei giocatori

## Tecnologie utilizzate

- React
- TypeScript
- Supabase (autenticazione e database)
- CSS puro

## Squadre

L'applicazione include le seguenti squadre di hockey su prato:
- Tevere
- Amsicora
- Ferrini
- Tricolore
- Bonomi
- Valchisone
- Cus Cagliari
- Lazio

## Configurazione

1. Clona il repository
2. Installa le dipendenze con `npm install`
3. Crea un account su [Supabase](https://supabase.com/) e crea un nuovo progetto
4. Copia l'URL e la chiave anonima di Supabase nel file `.env`
5. Configura le tabelle nel database Supabase:

### Tabella `profiles`

```sql
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  nome text,
  cognome text,
  email text,
  punteggio integer default 0,
  ruolo text default 'user'
);

-- Crea una policy per consentire l'accesso ai profili
alter table profiles enable row level security;
create policy "Gli utenti possono vedere tutti i profili" on profiles for select using (true);
create policy "Gli utenti possono aggiornare il proprio profilo" on profiles for update using (auth.uid() = id);
```

### Tabella `squadre`

```sql
create table squadre (
  id serial primary key,
  nome text not null unique,
  logo_url text,
  descrizione text
);

-- Crea una policy per consentire l'accesso alle squadre
alter table squadre enable row level security;
create policy "Tutti possono vedere le squadre" on squadre for select using (true);

-- Inserisci le squadre predefinite
insert into squadre (nome, logo_url, descrizione)
values
  ('Tevere', null, 'Squadra di Roma'),
  ('Amsicora', null, 'Squadra di Cagliari'),
  ('Ferrini', null, 'Squadra di Cagliari'),
  ('Tricolore', null, 'Squadra di Reggio Emilia'),
  ('Bonomi', null, 'Squadra di Castelletto Ticino'),
  ('Valchisone', null, 'Squadra di Pinerolo'),
  ('Cus Cagliari', null, 'Squadra di Cagliari'),
  ('Lazio', null, 'Squadra di Roma');
```

### Tabella `turni`

```sql
create table turni (
  id uuid primary key default uuid_generate_v4(),
  descrizione text not null,
  data_limite timestamp with time zone not null,
  data_creazione timestamp with time zone default now()
);

-- Crea una policy per consentire l'accesso ai turni
alter table turni enable row level security;
create policy "Tutti possono vedere i turni" on turni for select using (true);
create policy "Gli admin possono inserire turni" on turni for insert with check (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid() and profiles.ruolo = 'admin'
  )
);
create policy "Gli admin possono aggiornare turni" on turni for update using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid() and profiles.ruolo = 'admin'
  )
);
create policy "Gli admin possono eliminare turni" on turni for delete using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid() and profiles.ruolo = 'admin'
  )
);
```

### Tabella `partite`

```sql
create table partite (
  id uuid primary key default uuid_generate_v4(),
  turno_id uuid references turni not null,
  squadra_casa_id integer references squadre not null,
  squadra_ospite_id integer references squadre not null,
  data timestamp with time zone not null,
  risultato_casa integer,
  risultato_ospite integer,
  campionato text default 'Elite Maschile'
);

-- Crea una policy per consentire l'accesso alle partite
alter table partite enable row level security;
create policy "Tutti possono vedere le partite" on partite for select using (true);
create policy "Gli admin possono inserire partite" on partite for insert with check (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid() and profiles.ruolo = 'admin'
  )
);
create policy "Gli admin possono aggiornare partite" on partite for update using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid() and profiles.ruolo = 'admin'
  )
);
create policy "Gli admin possono eliminare partite" on partite for delete using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid() and profiles.ruolo = 'admin'
  )
);
```

### Tabella `pronostici`

```sql
create table pronostici (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  partita_id uuid references partite not null,
  pronostico_casa integer not null,
  pronostico_ospite integer not null,
  punti integer,
  unique (user_id, partita_id)
);

-- Crea una policy per consentire l'accesso ai pronostici
alter table pronostici enable row level security;
create policy "Gli utenti possono vedere tutti i pronostici" on pronostici for select using (true);
create policy "Gli utenti possono inserire i propri pronostici" on pronostici for insert with check (auth.uid() = user_id);
create policy "Gli utenti possono aggiornare i propri pronostici" on pronostici for update using (auth.uid() = user_id);
create policy "Gli admin possono eliminare pronostici" on pronostici for delete using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid() and profiles.ruolo = 'admin'
  )
);
create policy "Gli admin possono aggiornare tutti i pronostici" on pronostici for update using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid() and profiles.ruolo = 'admin'
  )
);
```

6. Configura un trigger per creare automaticamente un profilo quando un utente si registra:

```sql
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, nome, cognome, punteggio, ruolo)
  values (new.id, new.email, new.raw_user_meta_data->>'nome', new.raw_user_meta_data->>'cognome', 0, 'user');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

7. Configura le funzioni RPC per ottimizzare le operazioni di aggiornamento:

```sql
-- Funzione per resettare i punti di tutti i pronostici
create or replace function reset_all_pronostici_punti()
returns void as $$
begin
  update pronostici set punti = null where true;
end;
$$ language plpgsql security definer;

-- Funzione per aggiornare i punti dei pronostici di una partita
create or replace function update_pronostici_punti(p_partita_id uuid, p_risultato_casa integer, p_risultato_ospite integer)
returns void as $$
begin
  -- Aggiorna i pronostici con risultato esatto (3 punti)
  update pronostici
  set punti = 3
  where partita_id = p_partita_id
  and pronostico_casa = p_risultato_casa
  and pronostico_ospite = p_risultato_ospite;
  
  -- Aggiorna i pronostici con esito corretto - vittoria casa (1 punto)
  update pronostici
  set punti = 1
  where partita_id = p_partita_id
  and punti is null
  and pronostico_casa > pronostico_ospite
  and p_risultato_casa > p_risultato_ospite;
  
  -- Aggiorna i pronostici con esito corretto - vittoria ospite (1 punto)
  update pronostici
  set punti = 1
  where partita_id = p_partita_id
  and punti is null
  and pronostico_casa < pronostico_ospite
  and p_risultato_casa < p_risultato_ospite;
  
  -- Aggiorna i pronostici con esito corretto - pareggio (1 punto)
  update pronostici
  set punti = 1
  where partita_id = p_partita_id
  and punti is null
  and pronostico_casa = pronostico_ospite
  and p_risultato_casa = p_risultato_ospite;
  
  -- Imposta a 0 i punti per i pronostici rimanenti
  update pronostici
  set punti = 0
  where partita_id = p_partita_id
  and punti is null;
end;
$$ language plpgsql security definer;

-- Funzione per aggiornare i punteggi di tutti gli utenti
create or replace function update_all_user_scores()
returns void as $$
declare
  user_record record;
begin
  -- Itera su tutti gli utenti e aggiorna il punteggio uno per uno
  for user_record in select id from profiles loop
    update profiles
    set punteggio = (
      select coalesce(sum(punti), 0)
      from pronostici
      where user_id = user_record.id
    )
    where id = user_record.id;
  end loop;
end;
$$ language plpgsql security definer;
```

8. Avvia l'applicazione con `npm run dev`

## Sviluppo

- `npm run dev` - Avvia il server di sviluppo
- `npm run build` - Compila l'applicazione per la produzione
- `npm run preview` - Visualizza l'anteprima della build di produzione

## Licenza

MIT