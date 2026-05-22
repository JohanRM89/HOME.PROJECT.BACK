const BaseRepository = require('./BaseRepository');
const db = require('../config/database');

function mapTypeToCategory(type) {
  if (['task_assigned', 'task_completed', 'task_created'].includes(type)) {
    return 'Tareas';
  }

  if (['due_date', 'alert'].includes(type)) {
    return 'Alertas';
  }

  if (['family', 'report'].includes(type)) {
    return 'Familia';
  }

  return 'Todas';
}

class NotificationRepository extends BaseRepository {
  constructor() { super('notifications'); }



  async findForUser(userId, groupId, onlyUnread = false) {
    const extra = onlyUnread ? 'AND n.is_read = false' : '';
    console.log("iseId",userId)
    console.log("groupId",groupId)
    const { rows } = await db.query(
      `SELECT 
        n.*,
        t.title AS task_title,
        u.name  AS actor_name
     FROM notifications n
     LEFT JOIN tasks t ON n.task_id = t.id
     LEFT JOIN users u ON t.created_by = u.id
     WHERE n.user_id = $1
       AND n.group_id = $2
       ${extra}
     ORDER BY n.created_at DESC
     LIMIT 50`,
      [userId, groupId]
    );

    return rows.map(n => ({
      ...n,
      category: mapTypeToCategory(n.type)
    }));
  }



  async markAllRead(userId) {
    const { rowCount } = await db.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
      [userId]
    );
    return rowCount;
  }


  async createBulk(notifications) {
    if (!notifications.length) return [];

    const values = [];

    const placeholders = notifications.map((n, i) => {
      const base = i * 5; // ahora son 5 columnas

      values.push(
        n.user_id,
        n.task_id || null,
        n.type,
        n.message,
        n.group_id
      );

      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`;
    });

    const { rows } = await db.query(
      `INSERT INTO notifications (user_id, task_id, type, message, group_id)
     VALUES ${placeholders.join(', ')} RETURNING *`,
      values
    );

    return rows;
  }

}


module.exports = new NotificationRepository();
