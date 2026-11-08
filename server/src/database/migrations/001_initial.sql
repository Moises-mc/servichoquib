CREATE TABLE IF NOT EXISTS {{schema}}."users" (
  id TEXT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(254) NOT NULL UNIQUE,
  phone VARCHAR(40) NOT NULL DEFAULT '',
  role VARCHAR(20) NOT NULL CHECK (role IN ('cliente', 'prestador', 'admin')),
  password_hash TEXT NOT NULL,
  avatar VARCHAR(8) NOT NULL DEFAULT '',
  location VARCHAR(160) NOT NULL DEFAULT '',
  rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  bio TEXT NOT NULL DEFAULT '',
  specialty VARCHAR(120) NOT NULL DEFAULT '',
  availability VARCHAR(60) NOT NULL DEFAULT '',
  profile_image TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS users_role_idx ON {{schema}}."users" (role);

CREATE TABLE IF NOT EXISTS {{schema}}."services" (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES {{schema}}."users"(id) ON DELETE RESTRICT,
  provider VARCHAR(120) NOT NULL,
  avatar VARCHAR(8) NOT NULL DEFAULT '',
  category VARCHAR(60) NOT NULL,
  title VARCHAR(120) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC(14,2) NOT NULL CHECK (price > 0),
  unit VARCHAR(60) NOT NULL DEFAULT 'por servicio',
  rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  reviews INTEGER NOT NULL DEFAULT 0 CHECK (reviews >= 0),
  location VARCHAR(160) NOT NULL DEFAULT '',
  img TEXT NOT NULL DEFAULT '',
  available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS services_owner_idx ON {{schema}}."services" (owner_id);
CREATE INDEX IF NOT EXISTS services_available_idx ON {{schema}}."services" (available);

CREATE TABLE IF NOT EXISTS {{schema}}."bookings" (
  id TEXT PRIMARY KEY,
  service_id TEXT REFERENCES {{schema}}."services"(id) ON DELETE SET NULL,
  client_id TEXT NOT NULL REFERENCES {{schema}}."users"(id) ON DELETE RESTRICT,
  provider_id TEXT NOT NULL REFERENCES {{schema}}."users"(id) ON DELETE RESTRICT,
  title VARCHAR(120) NOT NULL,
  provider VARCHAR(120) NOT NULL,
  client VARCHAR(120) NOT NULL,
  date DATE NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL CHECK (status IN ('pendiente', 'confirmado', 'completado', 'cancelado')),
  total NUMERIC(14,2) NOT NULL CHECK (total >= 0),
  commission NUMERIC(14,2) NOT NULL DEFAULT 0,
  paid SMALLINT NOT NULL DEFAULT 0 CHECK (paid IN (0,1)),
  payment_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS bookings_client_idx ON {{schema}}."bookings" (client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS bookings_provider_idx ON {{schema}}."bookings" (provider_id, created_at DESC);

CREATE TABLE IF NOT EXISTS {{schema}}."messages" (
  id TEXT PRIMARY KEY,
  sender_id TEXT NOT NULL REFERENCES {{schema}}."users"(id) ON DELETE CASCADE,
  receiver_id TEXT NOT NULL REFERENCES {{schema}}."users"(id) ON DELETE CASCADE,
  sender_name VARCHAR(120) NOT NULL,
  text TEXT NOT NULL DEFAULT '',
  attachment JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  edited_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS messages_conversation_idx ON {{schema}}."messages" (sender_id, receiver_id, created_at);
CREATE INDEX IF NOT EXISTS messages_receiver_idx ON {{schema}}."messages" (receiver_id, created_at);

CREATE TABLE IF NOT EXISTS {{schema}}."reviews" (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL UNIQUE REFERENCES {{schema}}."bookings"(id) ON DELETE CASCADE,
  service_id TEXT REFERENCES {{schema}}."services"(id) ON DELETE SET NULL,
  provider_id TEXT NOT NULL REFERENCES {{schema}}."users"(id) ON DELETE RESTRICT,
  user_id TEXT NOT NULL REFERENCES {{schema}}."users"(id) ON DELETE RESTRICT,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment VARCHAR(2000) NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS reviews_service_idx ON {{schema}}."reviews" (service_id);

CREATE TABLE IF NOT EXISTS {{schema}}."password_resets" (
  email VARCHAR(254) PRIMARY KEY REFERENCES {{schema}}."users"(email) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
