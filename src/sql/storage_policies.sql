-- Policy RLS per il bucket di storage 'loghi'

-- Crea il bucket se non esiste
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public, avif_autodetection, owner, created_at, updated_at, file_size_limit, allowed_mime_types)
    VALUES ('loghi', 'loghi', true, false, NULL, current_timestamp, current_timestamp, NULL, ARRAY['image/jpeg', 'image/png', 'image/gif'])
    ON CONFLICT (id) DO NOTHING;
END
$$;

-- Policy per consentire a tutti gli utenti autenticati di caricare file nel bucket 'loghi'
CREATE POLICY "Consenti upload a utenti autenticati" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'loghi');

-- Policy per consentire agli utenti autenticati di leggere tutti i file nel bucket 'loghi'
CREATE POLICY "Consenti lettura a utenti autenticati" 
ON storage.objects 
FOR SELECT 
TO authenticated 
USING (bucket_id = 'loghi');

-- Policy per consentire agli utenti di aggiornare solo i propri file
CREATE POLICY "Consenti aggiornamento solo al proprietario" 
ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (bucket_id = 'loghi' AND owner = auth.uid());

-- Policy per consentire agli utenti di eliminare solo i propri file
CREATE POLICY "Consenti eliminazione solo al proprietario" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (bucket_id = 'loghi' AND owner = auth.uid());

-- Policy per consentire accesso anonimo in lettura (opzionale - utile per logo pubblici)
CREATE POLICY "Consenti lettura pubblica" 
ON storage.objects 
FOR SELECT 
TO anon 
USING (bucket_id = 'loghi'); 