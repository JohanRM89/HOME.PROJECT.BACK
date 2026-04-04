const BaseRepository = require('./BaseRepository');
const db = require('../config/database');

class NotificationRepository extends BaseRepository {
  constructor() { super('notifications'); }

  async findForUser(userId, onlyUnread = false) {
    const extra = onlyUnread ? 'AND is_read = false' : '';
    const { rows } = await db.query(
      `SELECT n.*, t.title AS task_title
       FROM notifications n
       LEFT JOIN tasks t ON n.task_id = t.id
       WHERE n.user_id = $1 ${extra}
       ORDER BY n.created_at DESC LIMIT 50`,
      [userId]
    );
    return rows;
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
      const base = i * 4;
      values.push(n.user_id, n.task_id || null, n.type, n.message);
      return `($${base+1}, $${base+2}, $${base+3}, $${base+4})`;
    });
    const { rows } = await db.query(
      `INSERT INTO notifications (user_id, task_id, type, message)
       VALUES ${placeholders.join(', ')} RETURNING *`,
      values
    );
    return rows;
  }
}

module.exports = new NotificationRepository();
