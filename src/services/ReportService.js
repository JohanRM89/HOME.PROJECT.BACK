const db = require('../config/database');
const { eventBus, EVENTS } = require('../patterns/EventBus');

class ReportService {
  async generateForGroup(groupId) {
    const periodEnd   = new Date();
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
    const rate  = total ? parseFloat(((totals.completed / total) * 100).toFixed(2)) : 0;

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

  async getReportsForGroup(groupId, limit = 10) {
    const { rows } = await db.query(
      `SELECT * FROM compliance_reports WHERE group_id = $1
       ORDER BY generated_at DESC LIMIT $2`,
      [groupId, limit]
    );
    return rows;
  }
}

module.exports = new ReportService();
