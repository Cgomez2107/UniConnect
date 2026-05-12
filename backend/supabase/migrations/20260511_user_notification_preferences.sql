-- ============================================================================
-- US-S01: User notification channel preferences
-- Fecha: 2026-05-11
-- Dependencias: Requiere que la tabla profiles exista (migraciones previas)
--
-- Estructura del JSONB channels_config por usuario:
--   {
--     "SOLICITUD_INGRESO": ["email_institucional", "in_app_websocket"],
--     "MIEMBRO_ACEPTADO": ["in_app_websocket", "push_movil"]
--   }
--   Ausencia de un eventType = todos los canales activos para ese tipo.
--   Arreglo vacio = ningun canal activo para ese tipo.
-- ============================================================================

-- 1) Tabla de preferencias de notificacion por usuario
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  user_id         UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  channels_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2) Indice para busquedas por usuario (util ya que PK es UUID)
CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_user
  ON user_notification_preferences(user_id);

-- 3) Indice GIN para busquedas dentro del JSONB si en el futuro se requiere
CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_channels
  ON user_notification_preferences USING GIN (channels_config);

-- 4) Row Level Security: solo el propio usuario o service-role pueden leer
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Politica: el usuario puede ver sus propias preferencias
CREATE POLICY user_notification_preferences_select
  ON user_notification_preferences
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Politica: el usuario puede modificar sus propias preferencias
CREATE POLICY user_notification_preferences_insert
  ON user_notification_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY user_notification_preferences_update
  ON user_notification_preferences
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 5) Trigger para actualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_user_notification_preferences_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_notification_preferences_updated_at ON user_notification_preferences;
CREATE TRIGGER trg_user_notification_preferences_updated_at
  BEFORE UPDATE ON user_notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_notification_preferences_updated_at();

-- 6) Funcion RPC para obtener canales activos de un usuario para un tipo de evento
--    Retorna un array de canales activos o NULL si no hay preferencias configuradas.
CREATE OR REPLACE FUNCTION get_active_notification_channels(
  p_user_id UUID,
  p_event_type TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_channels JSONB;
BEGIN
  SELECT channels_config->p_event_type
  INTO v_channels
  FROM user_notification_preferences
  WHERE user_id = p_user_id;

  RETURN v_channels;
END;
$$;

GRANT EXECUTE ON FUNCTION get_active_notification_channels(UUID, TEXT) TO authenticated;

-- 7) Funcion RPC para activar/desactivar un canal para un tipo de evento
--    Agrega o remueve el canal del arreglo JSONB segun corresponda.
CREATE OR REPLACE FUNCTION set_notification_channel_active(
  p_user_id UUID,
  p_event_type TEXT,
  p_canal TEXT,
  p_activo BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_channels JSONB;
  v_updated_channels JSONB;
BEGIN
  -- Obtener config actual para este eventType
  SELECT channels_config->p_event_type
  INTO v_current_channels
  FROM user_notification_preferences
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Si no hay config para este eventType, inicializar como arreglo vacio
  IF v_current_channels IS NULL THEN
    v_current_channels := '[]'::jsonb;
  END IF;

  -- Agregar o remover del arreglo
  IF p_activo THEN
    -- Agregar canal si no existe
    IF NOT v_current_channels @> to_jsonb(p_canal) THEN
      v_updated_channels := v_current_channels || to_jsonb(p_canal);
    ELSE
      v_updated_channels := v_current_channels;
    END IF;
  ELSE
    -- Remover canal si existe
    v_updated_channels := v_current_channels - p_canal;
  END IF;

  -- Actualizar el JSONB completo usando jsonb_set
  UPDATE user_notification_preferences
  SET channels_config = jsonb_set(
    COALESCE(channels_config, '{}'::jsonb),
    ('{' || p_event_type || '}')::text[],
    v_updated_channels
  )
  WHERE user_id = p_user_id;

  -- Si no existia fila, hacer upsert
  IF NOT FOUND THEN
    INSERT INTO user_notification_preferences (user_id, channels_config)
    VALUES (
      p_user_id,
      jsonb_build_object(p_event_type, v_updated_channels)
    );
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION set_notification_channel_active(UUID, TEXT, TEXT, BOOLEAN) TO authenticated;

-- 8) Comentarios de documentacion
COMMENT ON TABLE user_notification_preferences IS 'Preferencias de canales de notificacion por usuario y tipo de evento';
COMMENT ON COLUMN user_notification_preferences.channels_config IS 'JSONB con formato { "EVENT_TYPE": ["canal1", "canal2"] }. Ausencia de eventType = todos los canales activos.';
COMMENT ON FUNCTION get_active_notification_channels IS 'Retorna el arreglo de canales activos para un usuario y tipo de evento, o NULL si no hay preferencias';
COMMENT ON FUNCTION set_notification_channel_active IS 'Activa o desactiva un canal de notificacion para un usuario y tipo de evento especifico';
