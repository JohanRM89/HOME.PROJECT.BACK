BEGIN;

-- 1️⃣ eliminar constraint viejo PRIMERO
ALTER TABLE notifications
DROP CONSTRAINT IF EXISTS notifications_type_check;

-- --------------------------------------------------

-- 2️⃣ Normalizar datos existentes
UPDATE notifications SET type = 'task_assigned' WHERE type = 'assignment';
UPDATE notifications SET type = 'task_completed' WHERE type = 'status_change';

-- fallback por seguridad
UPDATE notifications
SET type = 'alert'
WHERE type NOT IN (
  'task_created',
  'task_assigned',
  'task_completed',
  'due_date',
  'alert',
  'family',
  'report'
);

-- --------------------------------------------------

-- 3️⃣ Crear nuevo constraint
ALTER TABLE notifications
ADD CONSTRAINT notifications_type_check
CHECK (type IN (
  'task_created',
  'task_assigned',
  'task_completed',
  'due_date',
  'alert',
  'family',
  'report'
));

-- --------------------------------------------------

-- 4️⃣ Asegurar columna group_id
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES family_groups(id);

-- --------------------------------------------------

-- 5️⃣ índices
CREATE INDEX IF NOT EXISTS idx_notifications_group_id
ON notifications(group_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_group
ON notifications(user_id, group_id);

COMMIT;