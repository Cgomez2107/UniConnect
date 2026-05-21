-- ══════════════════════════════════════════════════════════════════════════════
-- US-V04: Poll Messages (Encuestas Rápidas en Chat de Grupo)
-- Pattern: Decorator estructural sobre BaseMessage del Sprint 3 +
--          Concurrencia controlada por UNIQUE (poll_id, user_id) a nivel DB +
--          Auto-cierre programado vía scheduler externo (PollSchedulerService)
-- ══════════════════════════════════════════════════════════════════════════════

-- =============================================================================
-- 1. poll_configs: Configuración de cada encuesta
--    - FK a study_group_messages (herencia del mensaje decorado)
--    - FK a study_requests (ámbito del grupo)
--    - options: JSONB array de strings (2-10 opciones)
--    - status: 'active' | 'closed' (transicionado por scheduler o manual)
-- =============================================================================
CREATE TABLE IF NOT EXISTS poll_configs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id      UUID NOT NULL REFERENCES study_group_messages(id) ON DELETE CASCADE,
  group_id        UUID NOT NULL REFERENCES study_requests(id) ON DELETE CASCADE,
  created_by      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question        TEXT NOT NULL CHECK (char_length(question) >= 5 AND char_length(question) <= 500),
  options         JSONB NOT NULL CHECK (
    jsonb_typeof(options) = 'array'
    AND jsonb_array_length(options) BETWEEN 2 AND 10
  ),
  expires_at      TIMESTAMPTZ NOT NULL CHECK (expires_at > now()),
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_poll_configs_message_id ON poll_configs(message_id);
CREATE INDEX IF NOT EXISTS idx_poll_configs_group_id ON poll_configs(group_id);
CREATE INDEX IF NOT EXISTS idx_poll_configs_status ON poll_configs(status);
CREATE INDEX IF NOT EXISTS idx_poll_configs_expires_at_active
  ON poll_configs(expires_at)
  WHERE status = 'active';

-- =============================================================================
-- 2. poll_votes: Votos emitidos por participantes
--    - UNIQUE (poll_id, user_id): mitigación de condiciones de carrera por
--      diseño de base de datos (el segundo INSERT es rechazado por la constraint)
--    - selected_option: índice 0-based dentro del array options de poll_configs
-- =============================================================================
CREATE TABLE IF NOT EXISTS poll_votes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id         UUID NOT NULL REFERENCES poll_configs(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  selected_option INTEGER NOT NULL CHECK (selected_option >= 0),
  voted_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_vote_per_poll_user UNIQUE (poll_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_poll_votes_poll_id ON poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_user_id ON poll_votes(user_id);

-- =============================================================================
-- 3. Función RPC: cast_vote
--    Inserta un voto con validaciones y cálculo de resultados.
--    Utiliza SELECT ... FOR UPDATE para lock de fila y prevenir condiciones
--    de carrera antes de la UNIQUE constraint.
--    Retorna JSONB con resultados agregados para broadcast en tiempo real.
-- =============================================================================
CREATE OR REPLACE FUNCTION cast_vote(
  p_poll_id   UUID,
  p_user_id   UUID,
  p_option    INTEGER
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status     TEXT;
  v_question   TEXT;
  v_options    JSONB;
  v_expires_at TIMESTAMPTZ;
  v_group_id   UUID;
  v_noptions   INTEGER;
  v_results    JSONB;
  v_total      INTEGER;
BEGIN
  -- 1. Validar que la encuesta existe y bloquear la fila (evita race condition en
  --    la ventana entre esta validación y el INSERT)
  SELECT status, question, options, expires_at, group_id
    INTO v_status, v_question, v_options, v_expires_at, v_group_id
  FROM poll_configs
  WHERE id = p_poll_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Encuesta no encontrada'
      USING ERRCODE = 'P0001', HINT = 'poll_id no existe en poll_configs';
  END IF;

  -- 1b. Validar que el usuario votante coincida con el autenticado
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'No puedes votar en nombre de otro usuario'
      USING ERRCODE = 'P0001';
  END IF;

  -- 1c. Validar que el usuario sea miembro del grupo
  IF NOT is_request_member(v_group_id, p_user_id) THEN
    RAISE EXCEPTION 'No eres miembro de este grupo'
      USING ERRCODE = 'P0001';
  END IF;

  -- 2. Validar que la encuesta no esté cerrada
  IF v_status = 'closed' THEN
    RAISE EXCEPTION 'La encuesta ya está cerrada'
      USING ERRCODE = 'P0001', HINT = 'status = closed, no se aceptan más votos';
  END IF;

  -- 3. Validar que no haya expirado; si expiró, cerrarla automáticamente
  IF v_expires_at <= now() THEN
    UPDATE poll_configs
      SET status = 'closed', updated_at = now()
    WHERE id = p_poll_id;

    RAISE EXCEPTION 'La encuesta ha expirado'
      USING ERRCODE = 'P0001', HINT = 'expires_at alcanzado, encuesta cerrada automáticamente';
  END IF;

  -- 4. Validar que la opción esté dentro del rango
  v_noptions := jsonb_array_length(v_options);

  IF p_option IS NULL OR p_option < 0 OR p_option >= v_noptions THEN
    RAISE EXCEPTION 'Opción inválida: debe estar entre 0 y %', v_noptions - 1
      USING ERRCODE = 'P0001';
  END IF;

  -- 5. Insertar voto — la UNIQUE constraint (poll_id, user_id) garantiza que
  --    ningún estudiante vote dos veces. En caso de violación, PostgreSQL
  --    lanza SQLSTATE 23505 que es capturado en código de aplicación como
  --    DUPLICATE_VOTE (HTTP 400).
  INSERT INTO poll_votes (poll_id, user_id, selected_option)
  VALUES (p_poll_id, p_user_id, p_option);

  -- 6. Calcular resultados agregados con redondeo a un decimal
  --    Fórmula: ROUND((count(opción N) / totalVotos) * 100, 1)
  WITH option_indices AS (
    SELECT generate_series(0, v_noptions - 1) AS idx
  ),
  vote_counts AS (
    SELECT
      oi.idx,
      COALESCE(v.cnt, 0) AS cnt
    FROM option_indices oi
    LEFT JOIN LATERAL (
      SELECT COUNT(*) AS cnt
      FROM poll_votes pv
      WHERE pv.poll_id = p_poll_id AND pv.selected_option = oi.idx
    ) v ON true
  ),
  totals AS (
    SELECT COUNT(*) AS total FROM poll_votes WHERE poll_id = p_poll_id
  )
  SELECT
    jsonb_agg(
      jsonb_build_object(
        'option', v_options->>vc.idx,
        'count', vc.cnt,
        'percentage', CASE
          WHEN t.total > 0 THEN ROUND((vc.cnt::numeric / t.total) * 100, 1)
          ELSE 0
        END
      ) ORDER BY vc.idx
    ),
    t.total
  INTO v_results, v_total
  FROM vote_counts vc CROSS JOIN totals t;

  -- 7. Retornar payload completo para broadcast en tiempo real
  RETURN jsonb_build_object(
    'success', true,
    'pollId', p_poll_id,
    'userId', p_user_id,
    'selectedOption', p_option,
    'results', v_results,
    'totalVotes', v_total
  );
END;
$$;

-- =============================================================================
-- 4. Función auxiliar: get_poll_results
--    Calcula resultados actuales de una encuesta sin emitir voto.
--    Útil para consultar estado antes del cierre (AC4: creador ve resultados
--    en tiempo real sin votar).
-- =============================================================================
CREATE OR REPLACE FUNCTION get_poll_results(
  p_poll_id UUID
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status     TEXT;
  v_question   TEXT;
  v_options    JSONB;
  v_group_id   UUID;
  v_noptions   INTEGER;
  v_results    JSONB;
  v_total      INTEGER;
BEGIN
  SELECT status, question, options, group_id
    INTO v_status, v_question, v_options, v_group_id
  FROM poll_configs
  WHERE id = p_poll_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Encuesta no encontrada'
      USING ERRCODE = 'P0001';
  END IF;

  IF NOT is_request_member(v_group_id, auth.uid()) THEN
    RAISE EXCEPTION 'No tienes permiso para ver los resultados de esta encuesta'
      USING ERRCODE = 'P0001';
  END IF;

  v_noptions := jsonb_array_length(v_options);

  WITH option_indices AS (
    SELECT generate_series(0, v_noptions - 1) AS idx
  ),
  vote_counts AS (
    SELECT
      oi.idx,
      COALESCE(v.cnt, 0) AS cnt
    FROM option_indices oi
    LEFT JOIN LATERAL (
      SELECT COUNT(*) AS cnt
      FROM poll_votes pv
      WHERE pv.poll_id = p_poll_id AND pv.selected_option = oi.idx
    ) v ON true
  ),
  totals AS (
    SELECT COUNT(*) AS total FROM poll_votes WHERE poll_id = p_poll_id
  )
  SELECT
    jsonb_agg(
      jsonb_build_object(
        'option', v_options->>vc.idx,
        'count', vc.cnt,
        'percentage', CASE
          WHEN t.total > 0 THEN ROUND((vc.cnt::numeric / t.total) * 100, 1)
          ELSE 0
        END
      ) ORDER BY vc.idx
    ),
    t.total
  INTO v_results, v_total
  FROM vote_counts vc CROSS JOIN totals t;

  RETURN jsonb_build_object(
    'pollId', p_poll_id,
    'question', v_question,
    'status', v_status,
    'results', v_results,
    'totalVotes', v_total
  );
END;
$$;

-- =============================================================================
-- 5. Función RPC: close_expired_polls
--    Cierra todas las encuestas activas cuya fecha de expiración ya pasó.
--    Retorna un array JSON de UUIDs de las encuestas cerradas para que el
--    PollSchedulerService pueda emitir eventos POLL_CLOSED a cada grupo.
-- =============================================================================
CREATE OR REPLACE FUNCTION close_expired_polls()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_closed_ids jsonb;
BEGIN
  WITH updated AS (
    UPDATE poll_configs
      SET status = 'closed', updated_at = now()
    WHERE status = 'active' AND expires_at <= now()
    RETURNING id
  )
  SELECT COALESCE(jsonb_agg(id), '[]'::jsonb)
    INTO v_closed_ids
  FROM updated;

  RETURN jsonb_build_object(
    'closedCount', jsonb_array_length(v_closed_ids),
    'closedPollIds', v_closed_ids
  );
END;
$$;

-- =============================================================================
-- 6. Row Level Security (RLS)
--    Modelo de membresía: la función is_request_member() determina si un usuario
--    es miembro del grupo consultando study_requests.author_id,
--    study_request_admins y applications con status = 'aceptada'.
-- =============================================================================
ALTER TABLE poll_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

-- 6a. poll_configs: SELECT solo para miembros del grupo
DROP POLICY IF EXISTS poll_configs_select ON poll_configs;
CREATE POLICY poll_configs_select ON poll_configs
  FOR SELECT
  USING (
    is_request_member(group_id, auth.uid())
  );

-- 6b. poll_configs: INSERT solo para el creador (validado en aplicación)
DROP POLICY IF EXISTS poll_configs_insert ON poll_configs;
CREATE POLICY poll_configs_insert ON poll_configs
  FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- 6c. poll_configs: UPDATE solo para el sistema (status via scheduler)
--     El scheduler usa service_role, que bypassea RLS.
--     No se requiere policy de UPDATE para usuarios regulares.

-- 6d. poll_votes: INSERT para miembros del grupo
DROP POLICY IF EXISTS poll_votes_insert ON poll_votes;
CREATE POLICY poll_votes_insert ON poll_votes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM poll_configs pc
      WHERE pc.id = poll_id
        AND is_request_member(pc.group_id, auth.uid())
    )
    AND user_id = auth.uid()
  );

-- 6e. poll_votes: SELECT para el propio votante
DROP POLICY IF EXISTS poll_votes_select ON poll_votes;
CREATE POLICY poll_votes_select ON poll_votes
  FOR SELECT
  USING (user_id = auth.uid());

-- =============================================================================
-- 7. Permisos de ejecución para roles autenticados
-- =============================================================================
GRANT EXECUTE ON FUNCTION cast_vote(UUID, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_poll_results(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION close_expired_polls() TO service_role;
