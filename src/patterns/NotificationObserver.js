// ============================================================
// Observer concreto: crea notificaciones en BD al escuchar eventos
// ============================================================
const { eventBus, EVENTS } = require('./EventBus');
const NotificationRepository = require('../repositories/NotificationRepository');

class NotificationObserver {
  static register() {
    eventBus.on(EVENTS.TASK_ASSIGNED, async ({ task, assignedUser }) => {
      try {
        await NotificationRepository.create({
          user_id: assignedUser.id,
          task_id: task.id,
          type:    'assignment',
          message: `Se te asignó la tarea: "${task.title}"`,
        });
      } catch (e) { console.error('[NotificationObserver] TASK_ASSIGNED:', e.message); }
    });

    eventBus.on(EVENTS.TASK_STATUS_CHANGED, async ({ task, actor }) => {
      try {
        if (task.created_by !== actor.id) {
          await NotificationRepository.create({
            user_id: task.created_by,
            task_id: task.id,
            type:    'status_change',
            message: `La tarea "${task.title}" cambió a estado: ${task.status}`,
          });
        }
      } catch (e) { console.error('[NotificationObserver] STATUS_CHANGED:', e.message); }
    });

    eventBus.on(EVENTS.TASK_DUE_SOON, async ({ tasks }) => {
      try {
        const notifs = tasks
          .filter(t => t.assigned_to)
          .map(t => ({
            user_id: t.assigned_to,
            task_id: t.id,
            type:    'due_date',
            message: `La tarea "${t.title}" vence pronto: ${new Date(t.due_date).toLocaleDateString()}`,
          }));
        if (notifs.length) await NotificationRepository.createBulk(notifs);
      } catch (e) { console.error('[NotificationObserver] DUE_SOON:', e.message); }
    });

    eventBus.on(EVENTS.REPORT_GENERATED, async ({ report, groupMembers }) => {
      try {
        const notifs = groupMembers.map(uid => ({
          user_id: uid,
          task_id: null,
          type:    'report',
          message: `Nuevo reporte de cumplimiento generado: ${report.compliance_rate}% completadas`,
        }));
        if (notifs.length) await NotificationRepository.createBulk(notifs);
      } catch (e) { console.error('[NotificationObserver] REPORT:', e.message); }
    });

    console.log('[NotificationObserver] Escuchando eventos registrado ✓');
  }
}

module.exports = NotificationObserver;
