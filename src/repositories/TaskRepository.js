const BaseRepository = require("./BaseRepository");
const db = require("../config/database");

class TaskRepository extends BaseRepository {
  constructor() {
    super("tasks");
  }

  async findWithDetails(filters = {}, options = {}) {
    const { status, priority, groupId, assignedTo } = filters;
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;
    const conditions = [];
    const values = [];
    let idx = 1;
    if (status) {
      conditions.push(`t.status = $${idx++}`);
      values.push(status);
    }
    if (priority) {
      conditions.push(`t.priority = $${idx++}`);
      values.push(priority);
    }
    if (groupId) {
      conditions.push(`t.group_id = $${idx++}`);
      values.push(groupId);
    }
    if (assignedTo) {
      conditions.push(`t.assigned_to = $${idx++}`);
      values.push(assignedTo);
    }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const dataQ = db.query(
      `SELECT t.*,
              ct.name,
              ct.icon,
              ct.color,
              uc.name AS created_by_name,
              ua.name AS assigned_to_name,
              fg.name AS group_name
       FROM tasks t
       LEFT JOIN users uc          ON t.created_by  = uc.id
       LEFT JOIN categories ct          ON t.category_id = ct.id
       LEFT JOIN users ua          ON t.assigned_to = ua.id
       LEFT JOIN family_groups fg  ON t.group_id    = fg.id
       ${where}
       ORDER BY
         CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
         t.due_date ASC NULLS LAST
       LIMIT $${idx++} OFFSET $${idx}`,
      [...values, limit, offset],
    );

    const countQ = db.query(
      `SELECT COUNT(*)::int AS total FROM tasks t ${where}`,
      values,
    );

    const [{ rows }, { rows: countRows }] = await Promise.all([dataQ, countQ]);

    return {
      tasks: rows,
      total: countRows[0].total,
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
      [id],
    );
    return rows[0] || null;
  }

  async findOverdue() {
    const { rows } = await db.query(
      `SELECT t.*, u.name AS assigned_to_name, u.email AS assigned_to_email
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       WHERE t.due_date < NOW()
         AND t.status != 'completed'`,
    );
    return rows;
  }

  async getStatusSummary(groupId) {
    const { rows } = await db.query(
      `SELECT status, COUNT(*)::int AS count
       FROM tasks WHERE group_id = $1
       GROUP BY status`,
      [groupId],
    );
    return rows;
  }
  async userBelongsToGroup(userId, groupId) {
    const query = `
      SELECT 1
      FROM user_groups
      WHERE user_id = $1
        AND group_id = $2
      LIMIT 1
    `;

    const result = await db.query(query, [userId, groupId]);
    return result.rowCount > 0;
  }
  async getCalendarByGroup(groupId, mes) {
    const params = [groupId];

    let query = `
      SELECT 
        t.id,
        t.title,
        t.status,
        t.priority,
        t.due_date,
        COALESCE(
          STRING_AGG(u.name, ', '),
          ''
        ) AS assigned_users
      FROM tasks t
      LEFT JOIN task_assignments ta 
        ON t.id = ta.task_id
      LEFT JOIN users u 
        ON ta.user_id = u.id
      WHERE t.group_id = $1
        AND t.due_date IS NOT NULL
    `;

    if (mes) {
      params.push(mes);
      query += `
        AND TO_CHAR(t.due_date, 'YYYY-MM') = $2
      `;
    }

    query += `
      GROUP BY t.id
      ORDER BY t.due_date ASC
    `;

    const result = await db.query(query, params);
    return result.rows;
  }

  async getCalendarByUserAndDay(userId, groupId, dia) {
  const query = `
    SELECT 
      t.id,
      t.title,
      t.status,
      t.priority,
      t.due_date,
      t.points,
      c.name AS category_name,
      c.icon AS category_icon,
      c.color AS category_color
    FROM tasks t
   
    LEFT JOIN categories c 
      ON t.category_id = c.id
    WHERE t.group_id = $1
      AND t.assigned_to = $2
      AND t.due_date::date = $3::date
    ORDER BY t.due_date ASC
  `;

  const result = await db.query(query, [groupId, userId, dia]);
  return result.rows;
}
}

module.exports = new TaskRepository();
