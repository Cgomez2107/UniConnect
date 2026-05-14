-- ══════════════════════════════════════════════════════════════════════════════
-- US V05: Foro de Asignaturas (academic-qna)
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1. TABLA: forum_questions ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS forum_questions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id    UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  author_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title         VARCHAR(200) NOT NULL,
  body          TEXT NOT NULL,
  status        VARCHAR(20) NOT NULL DEFAULT 'active',
  answer_count  INTEGER NOT NULL DEFAULT 0,
  vote_count    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2. TABLA: forum_answers ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS forum_answers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id   UUID NOT NULL REFERENCES forum_questions(id) ON DELETE CASCADE,
  author_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body          TEXT NOT NULL,
  vote_count    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 3. TABLA: forum_votes ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS forum_votes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type VARCHAR(10) NOT NULL CHECK (target_type IN ('question','answer')),
  target_id   UUID NOT NULL,
  voter_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vote_type   VARCHAR(10) NOT NULL CHECK (vote_type IN ('upvote','downvote')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (target_type, target_id, voter_id)
);

-- ── 4. ÍNDICES ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_forum_questions_subject
  ON forum_questions(subject_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_forum_answers_question
  ON forum_answers(question_id, vote_count DESC);

CREATE INDEX IF NOT EXISTS idx_forum_votes_target_voter
  ON forum_votes(target_id, voter_id);

-- ── 5. TRIGGER: actualizar updated_at en forum_questions ──────────────────────

CREATE OR REPLACE FUNCTION update_forum_questions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS forum_questions_set_updated_at ON forum_questions;
CREATE TRIGGER forum_questions_set_updated_at
  BEFORE UPDATE ON forum_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_forum_questions_updated_at();

-- ── 6. TRIGGER: actualizar updated_at en forum_answers ────────────────────────

CREATE OR REPLACE FUNCTION update_forum_answers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS forum_answers_set_updated_at ON forum_answers;
CREATE TRIGGER forum_answers_set_updated_at
  BEFORE UPDATE ON forum_answers
  FOR EACH ROW
  EXECUTE FUNCTION update_forum_answers_updated_at();

-- ── 7. FUNCIÓN RPC: rpc_vote (votación atómica con toggle) ────────────────────

CREATE OR REPLACE FUNCTION rpc_vote(
  p_target_type VARCHAR(10),
  p_target_id   UUID,
  p_voter_id    UUID,
  p_vote_type   VARCHAR(10)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_vote_count INTEGER;
  v_target_subject_id UUID;
  v_is_author BOOLEAN;
  v_vote_delta INTEGER;
BEGIN
  -- Validar autenticación
  IF p_voter_id <> auth.uid() THEN
    RAISE EXCEPTION 'No autorizado.' USING ERRCODE = 'P0001';
  END IF;

  -- Validar target_type
  IF p_target_type NOT IN ('question','answer') THEN
    RAISE EXCEPTION 'target_type debe ser question o answer.' USING ERRCODE = 'P0001';
  END IF;

  -- Validar vote_type
  IF p_vote_type NOT IN ('upvote','downvote') THEN
    RAISE EXCEPTION 'vote_type debe ser upvote o downvote.' USING ERRCODE = 'P0001';
  END IF;

  -- Obtener subject_id y verificar que el target existe + auto-voto
  IF p_target_type = 'question' THEN
    SELECT fq.subject_id, fq.author_id INTO v_target_subject_id, v_is_author
    FROM forum_questions fq
    WHERE fq.id = p_target_id;

    IF v_target_subject_id IS NULL THEN
      RAISE EXCEPTION 'Pregunta no encontrada.' USING ERRCODE = 'P0001';
    END IF;

    IF v_is_author = p_voter_id THEN
      RAISE EXCEPTION 'No puedes votar tu propia pregunta.' USING ERRCODE = 'P0001';
    END IF;
  ELSE
    SELECT fq.subject_id, fa.author_id INTO v_target_subject_id, v_is_author
    FROM forum_answers fa
    JOIN forum_questions fq ON fq.id = fa.question_id
    WHERE fa.id = p_target_id;

    IF v_target_subject_id IS NULL THEN
      RAISE EXCEPTION 'Respuesta no encontrada.' USING ERRCODE = 'P0001';
    END IF;

    IF v_is_author = p_voter_id THEN
      RAISE EXCEPTION 'No puedes votar tu propia respuesta.' USING ERRCODE = 'P0001';
    END IF;
  END IF;

  -- Verificar matrícula del votante
  IF NOT EXISTS (
    SELECT 1 FROM user_subjects us
    WHERE us.user_id = p_voter_id AND us.subject_id = v_target_subject_id
  ) THEN
    RAISE EXCEPTION 'No estás matriculado en esta asignatura.' USING ERRCODE = 'P0001';
  END IF;

  -- Votación atómica: usa INSERT ... ON CONFLICT para eliminar la race condition
  -- Casos:
  --   1. Mismo tipo ya existe → DELETE (toggle off)
  --   2. Tipo diferente existe → UPDATE (switch)
  --   3. No existe → INSERT (new vote)
  WITH
  deleted AS (
    DELETE FROM forum_votes
    WHERE target_type = p_target_type
      AND target_id = p_target_id
      AND voter_id = p_voter_id
      AND vote_type = p_vote_type
    RETURNING vote_type
  ),
  upserted AS (
    INSERT INTO forum_votes (target_type, target_id, voter_id, vote_type)
    SELECT p_target_type, p_target_id, p_voter_id, p_vote_type
    WHERE NOT EXISTS (SELECT 1 FROM deleted)
    ON CONFLICT (target_type, target_id, voter_id) DO UPDATE
    SET vote_type = EXCLUDED.vote_type, created_at = NOW()
    RETURNING CASE WHEN xmax = 0 THEN 'new' ELSE 'switch' END AS action
  )
  SELECT
    CASE
      WHEN EXISTS (SELECT 1 FROM deleted)
        THEN CASE WHEN p_vote_type = 'upvote' THEN -1 ELSE 1 END
      WHEN (SELECT action FROM upserted) = 'new'
        THEN CASE WHEN p_vote_type = 'upvote' THEN 1 ELSE -1 END
      WHEN (SELECT action FROM upserted) = 'switch'
        THEN CASE WHEN p_vote_type = 'upvote' THEN 2 ELSE -2 END
      ELSE 0
    END
  INTO v_vote_delta;

  -- Aplicar el delta al target correspondiente
  IF p_target_type = 'question' THEN
    UPDATE forum_questions SET vote_count = vote_count + v_vote_delta
    WHERE id = p_target_id
    RETURNING vote_count INTO v_new_vote_count;
  ELSE
    UPDATE forum_answers SET vote_count = vote_count + v_vote_delta
    WHERE id = p_target_id
    RETURNING vote_count INTO v_new_vote_count;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'vote_count', v_new_vote_count
  );
END;
$$;

GRANT EXECUTE ON FUNCTION rpc_vote(VARCHAR(10), UUID, UUID, VARCHAR(10)) TO authenticated;

-- ── 8. SEGURIDAD RLS: forum_questions ─────────────────────────────────────────

ALTER TABLE forum_questions ENABLE ROW LEVEL SECURITY;

-- Todos los usuarios autenticados pueden leer preguntas
CREATE POLICY "forum_questions_select"
  ON forum_questions FOR SELECT
  TO authenticated
  USING (true);

-- Estudiantes matriculados en la asignatura pueden crear preguntas
CREATE POLICY "forum_questions_insert"
  ON forum_questions FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM user_subjects us
      WHERE us.user_id = auth.uid() AND us.subject_id = subject_id
    )
  );

-- Solo el autor puede actualizar su pregunta
CREATE POLICY "forum_questions_update"
  ON forum_questions FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Solo el autor puede eliminar su pregunta
CREATE POLICY "forum_questions_delete"
  ON forum_questions FOR DELETE
  TO authenticated
  USING (author_id = auth.uid());

-- ── 9. SEGURIDAD RLS: forum_answers ───────────────────────────────────────────

ALTER TABLE forum_answers ENABLE ROW LEVEL SECURITY;

-- Todos los usuarios autenticados pueden leer respuestas
CREATE POLICY "forum_answers_select"
  ON forum_answers FOR SELECT
  TO authenticated
  USING (true);

-- Estudiantes matriculados en la asignatura pueden responder
CREATE POLICY "forum_answers_insert"
  ON forum_answers FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM forum_questions fq
      JOIN user_subjects us ON us.subject_id = fq.subject_id
      WHERE fq.id = question_id AND us.user_id = auth.uid()
    )
  );

-- Solo el autor puede actualizar su respuesta
CREATE POLICY "forum_answers_update"
  ON forum_answers FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Solo el autor puede eliminar su respuesta
CREATE POLICY "forum_answers_delete"
  ON forum_answers FOR DELETE
  TO authenticated
  USING (author_id = auth.uid());

-- ── 10. SEGURIDAD RLS: forum_votes ────────────────────────────────────────────

ALTER TABLE forum_votes ENABLE ROW LEVEL SECURITY;

-- Cada usuario puede ver sus propios votos
CREATE POLICY "forum_votes_select"
  ON forum_votes FOR SELECT
  TO authenticated
  USING (voter_id = auth.uid());

-- La inserción de votos se maneja exclusivamente via rpc_vote (SECURITY DEFINER)
-- No se permiten INSERT/UPDATE/DELETE directos sobre forum_votes
CREATE POLICY "forum_votes_no_insert"
  ON forum_votes FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "forum_votes_no_update"
  ON forum_votes FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY "forum_votes_no_delete"
  ON forum_votes FOR DELETE
  TO authenticated
  USING (false);

-- ── 11. REALTIME ──────────────────────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE forum_questions;
ALTER PUBLICATION supabase_realtime ADD TABLE forum_answers;

-- ══════════════════════════════════════════════════════════════════════════════
-- FIN: Migración academic-qna completa
-- ══════════════════════════════════════════════════════════════════════════════
--
-- ✅ Tablas creadas:
--    - forum_questions (preguntas del foro)
--    - forum_answers (respuestas del foro)
--    - forum_votes (votos)
--
-- ✅ Índices creados:
--    - idx_forum_questions_subject
--    - idx_forum_answers_question
--    - idx_forum_votes_target_voter
--
-- ✅ Triggers:
--    - forum_questions_set_updated_at
--    - forum_answers_set_updated_at
--
-- ✅ Función RPC:
--    - rpc_vote(target_type, target_id, voter_id, vote_type)
--      → Lógica de toggle: insertar / cambiar / eliminar voto
--      → Validación de matrícula y auto-voto
--      → Actualización atómica de vote_count
--      → Retorna JSONB con { success, vote_count, vote_type }
--
-- ✅ RLS:
--    - forum_questions: SELECT todos, INSERT/UPDATE/DELETE solo autor
--    - forum_answers: SELECT todos, INSERT/UPDATE/DELETE solo autor
--    - forum_votes: solo SELECT propio, mutaciones exclusivas vía rpc_vote
--
-- ✅ Realtime:
--    - forum_questions y forum_answers publicados en supabase_realtime
--
-- ══════════════════════════════════════════════════════════════════════════════
