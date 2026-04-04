const BaseRepository = require('./BaseRepository');
const db = require('../config/database');

class TaskRepository extends BaseRepository {
  constructor() { super('tasks'); }

  async findWithDetails(filters = {}, options = {}) {
    const { status, priority, groupId, assignedTo } = filters;
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const conditions = [];
    const values     = [];
    let   idx        = 1;

    if (status)     { conditions.push(`t.status = $${idx++}`);      values.push(status); }
    if (priority)   { conditions.push(`t.priority = $${idx++}`);    values.push(priority); }
    if (groupId)    { conditions.push(`t.group_id = $${idx++}`);    values.push(groupId); }
    if (assignedTo) { conditions.push(`t.assigned_to = $${idx++}`); values.push(assignedTo); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const dataQ = db.query(
      `SELECT t.*,
              uc.name AS created_by_name,
              ua.name AS assigned_to_name,
              fg.name AS group_name
       FROM tasks t
       LEFT JOIN users uc          ON t.created_by  = uc.id
       LEFT JOIN users ua          ON t.assigned_to = ua.id
       LEFT JOIN family_groups fg  ON t.group_id    = fg.id
       ${where}
       ORDER BY
         CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
         t.due_date ASC NULLS LAST
       LIMIT $${idx++} OFFSET $${idx}`,
      [...values, limit, offset]
    );

    const countQ = db.query(
      `SELECT COUNT(*)::int AS total FROM tasks t ${where}`,
      values
    );

    const [{ rows }, { rows: countRows }] = await Promise.all([dataQ, countQ]);

    return {
      tasks:      rows,
      total:      countRows[0].total,
      page,
      totalPages: Math.ceil(countRows[0].total / limit),
    };
  }

  async findByIdWithDetails(id) {
    const { rows } = await db.query(
      `SELECT t.*,
              uc.name AS created_by_name, uc.email AS created_by_email,
              ua.name AS assigned_to_name, ua.email AS assigned_to_email,
              fg.name AS group_name
       FROM tasks t
       LEFT JOIN users uc         ON t.created_by  = uc.id
       LEFT JOIN users ua         ON t.assigned_to = ua.id
       LEFT JOIN family_groups fg ON t.group_id    = fg.id
       WHERE t.id = $1`,
      [id]
    );
    return rows[0] || null;
  }

  async findOverdue() {
    const { rows } = await db.query(
      `SELECT t.*, u.name AS assigned_to_name, u.email AS assigned_to_email
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       WHERE t.due_date < NOW()
         AND t.status != 'completed'`
    );
    return rows;
  }

  async getStatusSummary(groupId) {
    const { rows } = await db.query(
      `SELECT status, COUNT(*)::int AS count
       FROM tasks WHERE group_id = $1
       GROUP BY status`,
      [groupId]
    );
    return rows;
  }
}

module.exports = new TaskRepository();
