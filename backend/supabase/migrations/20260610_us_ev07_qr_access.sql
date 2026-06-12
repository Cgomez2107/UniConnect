-- US-EV07: QR Access Pass
-- Agrega columnas a event_registrations para el pase de acceso QR

ALTER TABLE event_registrations
  ADD COLUMN IF NOT EXISTS id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS qr_token        UUID UNIQUE DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS qr_hmac         TEXT,
  ADD COLUMN IF NOT EXISTS scanned_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS scanned_by      UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS is_used         BOOLEAN NOT NULL DEFAULT false;

-- Actualizar registros existentes con un qr_token único si es NULL
UPDATE event_registrations
SET qr_token = gen_random_uuid()
WHERE qr_token IS NULL;
