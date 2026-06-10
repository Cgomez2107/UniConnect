-- ============================================================================
-- US-EV02: Gestión Dinámica de Categorías de Eventos
-- Crea la tabla event_categories, migra datos existentes y añade FK a events
-- ============================================================================

-- 1. Crear tabla event_categories
CREATE TABLE IF NOT EXISTS public.event_categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    slug        VARCHAR(100) NOT NULL,
    description TEXT DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Índices únicos (case-insensitive para name)
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_categories_lower_name
    ON public.event_categories (LOWER(name));

CREATE UNIQUE INDEX IF NOT EXISTS idx_event_categories_slug
    ON public.event_categories (slug);

-- 3. Comentarios
COMMENT ON TABLE  public.event_categories IS 'Categorías dinámicas de eventos del campus';
COMMENT ON COLUMN public.event_categories.name IS 'Nombre visible (ej: "Académico")';
COMMENT ON COLUMN public.event_categories.slug IS 'Identificador URL-safe, se genera desde el nombre';

-- ============================================================================
-- 4. Seguridad (RLS)
-- ============================================================================
ALTER TABLE public.event_categories ENABLE ROW LEVEL SECURITY;

-- SELECT: cualquier usuario autenticado puede leer categorías (necesario para filtros)
CREATE POLICY "event_categories_select_all"
    ON public.event_categories FOR SELECT
    TO authenticated
    USING (true);

-- INSERT/UPDATE/DELETE: solo usuarios con role = 'admin' en profiles
CREATE POLICY "event_categories_insert_admin"
    ON public.event_categories FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "event_categories_update_admin"
    ON public.event_categories FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "event_categories_delete_admin"
    ON public.event_categories FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 5. Grant básicos (RLS refina a nivel de fila)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_categories TO authenticated;

-- ============================================================================
-- 6. Poblar categorías semilla (solo si no existen)
-- ============================================================================
INSERT INTO public.event_categories (name, slug, description) VALUES
    ('Académico', 'academico', 'Eventos académicos como conferencias, seminarios y talleres'),
    ('Cultural',  'cultural',  'Eventos culturales como conciertos, exposiciones y teatro'),
    ('Deportivo', 'deportivo', 'Eventos deportivos como torneos, maratones y competencias'),
    ('Otro',      'otro',      'Otros tipos de eventos del campus')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- 7. Migrar events.category → events.category_id
-- ============================================================================

-- 7.1 Añadir columna category_id (nullable inicialmente)
ALTER TABLE public.events
    ADD COLUMN IF NOT EXISTS category_id UUID
    REFERENCES public.event_categories(id);

-- 7.2 Mapear registros existentes: category (TEXT) → category_id (UUID)
UPDATE public.events e
    SET category_id = ec.id
    FROM public.event_categories ec
    WHERE e.category = ec.slug
      AND e.category_id IS NULL;

-- 7.3 Para eventos con categoría no reconocida, asignar "otro" por defecto
UPDATE public.events e
    SET category_id = (SELECT id FROM public.event_categories WHERE slug = 'otro')
    WHERE category_id IS NULL;

-- 7.4 Hacer category_id NOT NULL
ALTER TABLE public.events
    ALTER COLUMN category_id SET NOT NULL;

-- 7.5 Crear índice para joins frecuentes
CREATE INDEX IF NOT EXISTS idx_events_category_id
    ON public.events (category_id);

-- ============================================================================
-- 8. Eliminar el CHECK constraint antiguo
-- ============================================================================
ALTER TABLE public.events
    DROP CONSTRAINT IF EXISTS events_category_check;

-- Se conserva la columna `category` (TEXT) como redundancia temporal
-- para no romper las pantallas de estudiantes que filtran por category.
-- Se dropeará en un ciclo posterior cuando todas las referencias se migren
-- a usar category_id.
-- ALTER TABLE public.events DROP COLUMN IF EXISTS category;

-- ============================================================================
-- 9. Verificación (comentarios de validación)
-- ============================================================================
-- Para validar que la migración fue exitosa, ejecutar:
--
-- SELECT COUNT(*) AS total_categorias FROM public.event_categories;
-- → debe retornar 4+
--
-- SELECT COUNT(*) AS eventos_sin_categoria FROM public.events WHERE category_id IS NULL;
-- → debe retornar 0
--
-- SELECT e.id, e.title, e.category, ec.name AS categoria_nombre
-- FROM public.events e
-- JOIN public.event_categories ec ON ec.id = e.category_id
-- LIMIT 5;
-- → cada evento debe mostrar su categoría resuelta
