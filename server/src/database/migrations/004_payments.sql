-- Pagos con Rapyd (Checkout alojado, moneda COP)
ALTER TABLE {{schema}}."bookings"
  ADD COLUMN IF NOT EXISTS payment_checkout_id TEXT;

ALTER TABLE {{schema}}."bookings"
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) NOT NULL DEFAULT 'sin_pago';

CREATE INDEX IF NOT EXISTS bookings_checkout_idx
  ON {{schema}}."bookings" (payment_checkout_id);
