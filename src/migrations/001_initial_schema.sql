-- ======================================================
-- 001_initial_schema.sql
-- Task Manager - Esquema completo de base de datos
-- ======================================================

-- Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -------------------------------------------------------
-- TABLA: users
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(100)  NOT NULL,
  email         VARCHAR(255)  UNIQUE NOT NULL,
  password_hash VARCHAR(255)  NOT NULL,
  is_active     BOOLEAN       DEFAULT true,
  reset_token         VARCHAR(255),
  reset_token_expires TIMESTAMPTZ,
  created_at    TIMESTAMPTZ   DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- -------------------------------------------------------
-- TABLA: sessions  (tokens por sesión)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(255) NOT NULL,
  ip_address  VARCHAR(45),
  user_agent  TEXT,
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id    ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);

-- -------------------------------------------------------
-- TABLA: family_groups
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS family_groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL,
  created_by  UUID NOT NULL REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------
-- TABLA: user_groups  (relación N:M usuarios-grupos)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_groups (
  user_id   UUID NOT NULL REFERENCES users(id)          ON DELETE CASCADE,
  group_id  UUID NOT NULL REFERENCES family_groups(id)  ON DELETE CASCADE,
  role      VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin','member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, group_id)
);

CREATE INDEX IF NOT EXISTS idx_user_groups_group ON user_groups(group_id);

-- -------------------------------------------------------
-- TABLA: tasks
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       VARCHAR(200) NOT NULL,
  description TEXT,
  priority    VARCHAR(10)  DEFAULT 'medium'  CHECK (priority IN ('low','medium','high')),
  status      VARCHAR(20)  DEFAULT 'pending' CHECK (status  IN ('pending','in_progress','completed')),
  due_date    TIMESTAMPTZ,
  group_id    UUID REFERENCES family_groups(id) ON DELETE SET NULL,
  created_by  UUID NOT NULL REFERENCES users(id),
  assigned_to UUID          REFERENCES users(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_group_id    ON tasks(group_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status      ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date    ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_priority    ON tasks(priority);

-- -------------------------------------------------------
-- TABLA: notifications
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id   UUID REFERENCES tasks(id) ON DELETE CASCADE,
  type      VARCHAR(50) NOT NULL CHECK (type IN ('due_date','assignment','status_change','report')),
  message   TEXT NOT NULL,
  is_read   BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read  ON notifications(is_read);

-- -------------------------------------------------------
-- TABLA: compliance_reports
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS compliance_reports (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id         UUID NOT NULL REFERENCES family_groups(id) ON DELETE CASCADE,
  period_start     TIMESTAMPTZ NOT NULL,
  period_end       TIMESTAMPTZ NOT NULL,
  total_tasks      INTEGER DEFAULT 0,
  completed_tasks  INTEGER DEFAULT 0,
  pending_tasks    INTEGER DEFAULT 0,
  in_progress_tasks INTEGER DEFAULT 0,
  compliance_rate  DECIMAL(5,2) DEFAULT 0.00,
  generated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_group_id ON compliance_reports(group_id);

-- -------------------------------------------------------
-- TRIGGER: auto-actualizar updated_at
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_users_updated_at ON users;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();
DROP TRIGGER IF EXISTS trg_family_groups_updated_at ON family_groups;

CREATE TRIGGER trg_family_groups_updated_at
  BEFORE UPDATE ON family_groups
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();
DROP TRIGGER IF EXISTS trg_tasks_updated_at ON tasks;

CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();
-- -------------------------------------------------------
-- TABLA: schema_migrations  (control de versiones)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS schema_migrations (
  version     VARCHAR(100) PRIMARY KEY,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);
