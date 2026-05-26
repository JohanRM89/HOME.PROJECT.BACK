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
          type: 'task_assigned',
          group_id: task.group_id,
          message: `Se te asignó la tarea: "${task.title}"`,
        });
      } catch (e) { console.error('[NotificationObserver] TASK_ASSIGNED:', e.message); }
    });

    eventBus.on(EVENTS.TASK_STATUS_CHANGED, async ({ task, actor }) => {
      try {
          console.log(`[NotificationObserver] STATUS_CHANGED: Notificando a ${task} sobre cambio de estado de "${task.title}"`);
          await NotificationRepository.create({
            user_id: actor.id,
            task_id: task.id,
            group_id: task.group_id,
            type: 'task_completed',
            message: `La tarea "${task.title}" cambió a estado: ${task.status}`,
          });
      } catch (e) { console.error('[NotificationObserver] STATUS_CHANGED:', e.message); }
    });

    eventBus.on(EVENTS.TASK_DUE_SOON, async ({ tasks }) => {
      try {
        const notifs = tasks
          .filter(t => t.assigned_to)
          .map(t => ({
            user_id: t.assigned_to,
            task_id: t.id,
            type: 'due_date',
            group_id: task.group_id,

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
          type: 'report',
          group_id: task.group_id,
          message: `Nuevo reporte de cumplimiento generado: ${report.compliance_rate}% completadas`,
        }));
        if (notifs.length) await NotificationRepository.createBulk(notifs);
      } catch (e) { console.error('[NotificationObserver] REPORT:', e.message); }
    });

    eventBus.on(EVENTS.TASK_CREATED, async ({ task, groupMembers, actor }) => {
      try {
    

        const isSolo = groupMembers.length === 1;

        const notifications = groupMembers
          .filter(uid => isSolo || uid !== actor.id)
          .map(uid => ({
            user_id: uid,
            task_id: task.id,
            group_id: task.group_id,
            type: 'task_created',
            message: `${actor.name} creó la tarea "${task.title}"`,
          }));

        await NotificationRepository.createBulk(notifications);
      } catch (e) {
        console.error('[NotificationObserver] TASK_CREATED:', e.message);
      }
    });
    eventBus.on(EVENTS.TASK_STATUS_CHANGED, async ({ task, actor, groupMembers }) => {
      try {
        if (task.status === 'completed') {
          const notifications = groupMembers
            .filter(uid => uid !== actor.id)
            .map(uid => ({
              user_id: uid,
              task_id: task.id,
              group_id: task.group_id,
              type: 'task_completed',
              message: `${actor.name} completó "${task.title}"`,
            }));

          await NotificationRepository.createBulk(notifications);
        }
      } catch (e) {
        console.error('[NotificationObserver] TASK_COMPLETED:', e.message);
      }
    });
    eventBus.on(EVENTS.USER_JOINED_GROUP, async ({ user, groupMembers }) => {
      try {
        const notifications = groupMembers
          .filter(uid => uid !== user.id)
          .map(uid => ({
            user_id: uid,
            type: 'family',
            group_id: user.group_id,
            message: `${user.name} se unió al grupo`,
          }));

        await NotificationRepository.createBulk(notifications);
      } catch (e) {
        console.error('[NotificationObserver] USER_JOINED_GROUP:', e.message);
      }
    });
    ``
    console.log('[NotificationObserver] Escuchando eventos registrado ✓');
  }
}

module.exports = NotificationObserver;
