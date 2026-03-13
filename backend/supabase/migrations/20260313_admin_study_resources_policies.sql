-- ══════════════════════════════════════════════════════════════════════════════
-- Admin override para study_resources
-- Permite que el panel admin pueda actualizar/eliminar recursos de terceros
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════════════════════════════════════════

CREATE POLICY "study_resources_insert_admin"
  ON study_resources
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

CREATE POLICY "study_resources_update_admin"
  ON study_resources
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

CREATE POLICY "study_resources_delete_admin"
  ON study_resources
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );