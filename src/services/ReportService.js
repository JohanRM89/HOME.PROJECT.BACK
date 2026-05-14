const db = require('../config/database');
const { eventBus, EVENTS } = require('../patterns/EventBus');

class ReportService {
  async generateForGroup(groupId) {
    const periodEnd = new Date();
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - 30);

    const { rows: summary } = await db.query(
      `SELECT status, COUNT(*)::int AS count
       FROM tasks
       WHERE group_id = $1
         AND created_at BETWEEN $2 AND $3
       GROUP BY status`,
      [groupId, periodStart, periodEnd]
    );

    const totals = { pending: 0, in_progress: 0, completed: 0 };
    summary.forEach(r => { totals[r.status] = r.count; });
    const total = Object.values(totals).reduce((a, b) => a + b, 0);
    const rate = total ? parseFloat(((totals.completed / total) * 100).toFixed(2)) : 0;

    const { rows } = await db.query(
      `INSERT INTO compliance_reports
         (group_id, period_start, period_end, total_tasks,
          completed_tasks, pending_tasks, in_progress_tasks, compliance_rate)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [groupId, periodStart, periodEnd, total,
        totals.completed, totals.pending, totals.in_progress, rate]
    );

    const report = rows[0];

    // Obtener miembros del grupo para notificar
    const { rows: members } = await db.query(
      'SELECT user_id FROM user_groups WHERE group_id = $1',
      [groupId]
    );
    const memberIds = members.map(m => m.user_id);
    eventBus.emit(EVENTS.REPORT_GENERATED, { report, groupMembers: memberIds });

    return report;
  }

  async getReportsForGroup(groupId, limit = 1) {
    const { rows } = await db.query(
      `SELECT total_tasks, completed_tasks,pending_tasks, in_progress_tasks FROM compliance_reports WHERE group_id = $1
       ORDER BY generated_at DESC LIMIT $2`,
      [groupId, limit]
    );
    return rows;
  }

  async getReportsNew(group_id) {
    const periodEnd = new Date();
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - 30);

    // ✅ SUMMARY
    const { rows: summary } = await db.query(
      `SELECT status, COUNT(*)::int AS count
     FROM tasks
     WHERE group_id = $1
       AND created_at BETWEEN $2 AND $3
     GROUP BY status`,
      [group_id, periodStart, periodEnd]
    );

    const totals = { pending: 0, in_progress: 0, completed: 0 };
    summary.forEach(r => {
      totals[r.status] = r.count;
    });

    const total = Object.values(totals).reduce((a, b) => a + b, 0);

    const rate = total
      ? parseFloat(((totals.completed / total) * 100).toFixed(2))
      : 0;

    // ✅ INSERT (opcional)
    const { rows } = await db.query(
      `INSERT INTO compliance_reports
       (group_id, period_start, period_end, total_tasks,
        completed_tasks, pending_tasks, in_progress_tasks, compliance_rate)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        group_id,
        periodStart,
        periodEnd,
        total,
        totals.completed,
        totals.pending,
        totals.in_progress,
        rate,
      ]
    );

    const report = rows[0];

    // ✅ USERS STATS
    const { rows: userStats } = await db.query(
      `
    SELECT 
      u.id,
      u.name,
      COUNT(t.id) FILTER (WHERE t.status = 'completed') AS completed,
      COUNT(t.id) AS total
    FROM users u
    JOIN user_groups ug ON ug.user_id = u.id
    LEFT JOIN tasks t ON t.assigned_to = u.id
      AND t.group_id = $1
      AND t.created_at BETWEEN $2 AND $3
    WHERE ug.group_id = $1
    GROUP BY u.id
    `,
      [group_id, periodStart, periodEnd]
    );

    // ✅ FORMAT USERS
    const users = userStats.map(u => ({
      id: u.id,
      name: u.name,
      completed: parseInt(u.completed),
      total: parseInt(u.total),
      percent: u.total
        ? Math.round((u.completed / u.total) * 100)
        : 0,
    }));

    // ✅ EVENT
    const { rows: members } = await db.query(
      'SELECT user_id FROM user_groups WHERE group_id = $1',
      [group_id]
    );

    eventBus.emit(EVENTS.REPORT_GENERATED, {
      report,
      groupMembers: members.map(m => m.user_id),
    });

    // ✅ FINAL RESPONSE (LO MÁS IMPORTANTE)
    return {
      summary: {
        total,
        completed: totals.completed,
        pending: totals.pending,
        in_progress: totals.in_progress,
        complianceRate: rate,
      },
      users,
      report,
    };
  }
}

module.exports = new ReportService();
