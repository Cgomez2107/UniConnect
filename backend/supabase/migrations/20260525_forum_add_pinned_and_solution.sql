-- ══════════════════════════════════════════════════════════════════════════════
-- US V05: Agregar is_pinned e is_solution a forum_answers
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1. AGREGAR COLUMNAS a forum_answers ────────────────────────────────────────

ALTER TABLE forum_answers
  ADD COLUMN IF NOT EXISTS is_pinned   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_solution BOOLEAN NOT NULL DEFAULT false;

-- ── 2. ACTUALIZAR ÍNDICE EXISTENTE para incluir is_pinned ─────────────────────

DROP INDEX IF EXISTS idx_forum_answers_question;

CREATE INDEX idx_forum_answers_question
  ON forum_answers(question_id, is_pinned DESC, vote_count DESC);

-- ── 3. NUEVA POLÍTICA RLS: admin/docente puede fijar respuesta ─────────────────

-- Política para que el admin/docente pueda actualizar is_pinned en respuestas
CREATE POLICY "forum_answers_pin_by_admin"
  ON forum_answers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM forum_questions fq
      JOIN study_requests sr ON sr.id = fq.subject_id
      WHERE fq.id = forum_answers.question_id
        AND (sr.author_id = auth.uid() OR EXISTS (
          SELECT 1 FROM study_request_admins sra
          WHERE sra.request_id = sr.id AND sra.user_id = auth.uid()
        ))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM forum_questions fq
      JOIN study_requests sr ON sr.id = fq.subject_id
      WHERE fq.id = forum_answers.question_id
        AND (sr.author_id = auth.uid() OR EXISTS (
          SELECT 1 FROM study_request_admins sra
          WHERE sra.request_id = sr.id AND sra.user_id = auth.uid()
        ))
    )
  );

-- ── 4. ACTUALIZAR PUBLICACIÓN REALTIME ────────────────────────────────────────

-- Ya está publicada desde la migración original, no es necesario repetir

-- ══════════════════════════════════════════════════════════════════════════════
-- FIN: Migración is_pinned + is_solution
-- ══════════════════════════════════════════════════════════════════════════════