ALTER TABLE {{schema}}."users"
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS users_active_role_idx
  ON {{schema}}."users" (is_active, role);

