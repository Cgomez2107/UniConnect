-- Elimina la FK constraint profiles_id_fkey que referencia auth.users(id).
-- El auth service usa almacenamiento en memoria (TODO: migrar a PostgreSQL).
-- Mientras tanto, esta FK impide crear perfiles para usuarios que no existen
-- en auth.users de Supabase.
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
