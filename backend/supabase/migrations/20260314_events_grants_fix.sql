-- Fix de permisos para tabla events
-- Error objetivo: "permission denied for table events"

-- Concede permisos base a usuarios autenticados.
-- RLS sigue controlando quién puede INSERT/UPDATE/DELETE.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.events TO authenticated;

-- Opcional: lectura pública si se requiere en pantallas no autenticadas.
-- Mantener comentado si no aplica.
-- GRANT SELECT ON TABLE public.events TO anon;
