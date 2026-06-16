-- ══════════════════════════════════════════════════════════════════════════════
-- Migration: Add is_verified column to auth_users table
-- Sprint 5 — US-N8N02: Welcome email via n8n
-- Agrega el campo is_verified (BOOLEAN, default false) para rastrear si el
-- usuario ha confirmado su correo institucional. El webhook 'usuario.verificado'
-- solo se emite cuando este campo pasa a true.
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.auth_users
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false;

-- Actualizar usuarios existentes como verificados (migración hacia atrás)
UPDATE public.auth_users SET is_verified = true WHERE is_verified IS NULL;
