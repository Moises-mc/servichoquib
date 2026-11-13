ALTER TABLE {{schema}}."users" ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE {{schema}}."users" ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE {{schema}}."password_resets" ADD COLUMN IF NOT EXISTS attempts SMALLINT NOT NULL DEFAULT 0;
ALTER TABLE {{schema}}."password_resets" ADD COLUMN IF NOT EXISTS method VARCHAR(10) NOT NULL DEFAULT 'email';
CREATE TABLE IF NOT EXISTS {{schema}}."pending_registrations" (
 email VARCHAR(254) PRIMARY KEY, name VARCHAR(100) NOT NULL, phone VARCHAR(40) NOT NULL DEFAULT '',
 role VARCHAR(20) NOT NULL CHECK (role IN ('cliente','prestador')), password_hash TEXT NOT NULL,
 code_hash TEXT NOT NULL, expires_at TIMESTAMPTZ NOT NULL, attempts SMALLINT NOT NULL DEFAULT 0,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS {{schema}}."phone_verifications" (
 user_id TEXT PRIMARY KEY REFERENCES {{schema}}."users"(id) ON DELETE CASCADE,
 code_hash TEXT NOT NULL, expires_at TIMESTAMPTZ NOT NULL, attempts SMALLINT NOT NULL DEFAULT 0,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Limpieza limitada a los identificadores/correos de demostración conocidos.
DELETE FROM {{schema}}."reviews" WHERE booking_id IN ('b1','b2','b3') OR provider_id IN ('p1','p2','p3','p4','p5','p6','p7','p8','a1') OR user_id IN ('c1','c2');
DELETE FROM {{schema}}."messages" WHERE sender_id IN ('c1','c2','p1','p2','p3','p4','p5','p6','p7','p8','a1') OR receiver_id IN ('c1','c2','p1','p2','p3','p4','p5','p6','p7','p8','a1');
DELETE FROM {{schema}}."bookings" WHERE id IN ('b1','b2','b3') OR client_id IN ('c1','c2') OR provider_id IN ('p1','p2','p3','p4','p5','p6','p7','p8','a1');
DELETE FROM {{schema}}."services" WHERE id IN ('s1','s2','s3','s4','s5','s6','s7','s8') OR owner_id IN ('p1','p2','p3','p4','p5','p6','p7','p8');
DELETE FROM {{schema}}."users" WHERE id IN ('c1','c2','p1','p2','p3','p4','p5','p6','p7','p8','a1') OR email IN ('ana@email.com','pedro@email.com','carlos@email.com','lucia@email.com','jesus@email.com','marco@email.com','andres@email.com','sandra@email.com','fabio@email.com','gloria@email.com','admin@servicios.co');
