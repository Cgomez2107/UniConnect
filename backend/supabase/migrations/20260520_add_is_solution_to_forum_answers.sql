-- ══════════════════════════════════════════════════════════════════════════════
-- US V05: Agregar columna is_solution a forum_answers + actualizar índice
-- ══════════════════════════════════════════════════════════════════════════════
-- Criterio 5: La respuesta marcada como solución queda fijada al tope de
-- la lista independientemente del conteo de votos.
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE forum_answers
  ADD COLUMN IF NOT EXISTS is_solution BOOLEAN NOT NULL DEFAULT false;

DROP INDEX IF EXISTS idx_forum_answers_question;

CREATE INDEX IF NOT EXISTS idx_forum_answers_question
  ON forum_answers(question_id, is_solution DESC, vote_count DESC);
