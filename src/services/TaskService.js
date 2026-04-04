const TaskRepository         = require('../repositories/TaskRepository');
const NotificationRepository = require('../repositories/NotificationRepository');
const { eventBus, EVENTS }   = require('../patterns/EventBus');
const TaskFilterStrategy     = require('../patterns/TaskFilterStrategy');

class TaskService {
  // ── Listar con filtros ───────────────────────────────────
  async list(query = {}, paging = {}) {
    const filters = TaskFilterStrategy.buildFilters(query);
    return TaskRepository.findWithDetails(filters, paging);
  }

  // ── Obtener una tarea ────────────────────────────────────
  async getById(id) {
    const task = await TaskRepository.findByIdWithDetails(id);
    if (!task) {
      const err = new Error('Tarea no encontrada'); err.status = 404; throw err;
    }
    return task;
  }

  // ── Crear tarea ──────────────────────────────────────────
  async create(data, actor) {
    const task = await TaskRepository.create({
      title:       data.title,
      description: data.description || null,
      priority:    data.priority    || 'medium',
      status:      'pending',
      due_date:    data.due_date    || null,
      group_id:    data.group_id    || null,
      created_by:  actor.id,
      assigned_to: data.assigned_to || null,
    });

    eventBus.emit(EVENTS.TASK_CREATED, { task, actor });

    if (task.assigned_to && task.assigned_to !== actor.id) {
      eventBus.emit(EVENTS.TASK_ASSIGNED, {
        task,
        assignedUser: { id: task.assigned_to },
      });
    }

    return TaskRepository.findByIdWithDetails(task.id);
  }

  // ── Actualizar tarea ─────────────────────────────────────
  async update(id, data, actor) {
    const existing = await this.getById(id);

    const updated = await TaskRepository.update(id, {
      ...(data.title       !== undefined && { title:       data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.priority    !== undefined && { priority:    data.priority }),
      ...(data.due_date    !== undefined && { due_date:    data.due_date }),
      ...(data.assigned_to !== undefined && { assigned_to: data.assigned_to }),
      ...(data.group_id    !== undefined && { group_id:    data.group_id }),
    });

    // Detectar cambio de asignado
    if (data.assigned_to && data.assigned_to !== existing.assigned_to) {
      eventBus.emit(EVENTS.TASK_ASSIGNED, {
        task: updated,
        assignedUser: { id: data.assigned_to },
      });
    }

    eventBus.emit(EVENTS.TASK_UPDATED, { task: updated, actor });
    return TaskRepository.findByIdWithDetails(id);
  }

  // ── Cambiar estado ───────────────────────────────────────
  async changeStatus(id, status, actor) {
    const existing = await this.getById(id);
    if (existing.status === status) return existing;

    const extraFields = status === 'completed' ? { completed_at: new Date() } : {};
    const updated = await TaskRepository.update(id, { status, ...extraFields });

    eventBus.emit(EVENTS.TASK_STATUS_CHANGED, { task: updated, actor });
    return TaskRepository.findByIdWithDetails(id);
  }

  // ── Eliminar tarea ───────────────────────────────────────
  async remove(id, actor) {
    const task = await this.getById(id);
    if (task.created_by !== actor.id) {
      const err = new Error('No tienes permiso para eliminar esta tarea');
      err.status = 403; throw err;
    }
    await TaskRepository.delete(id);
    eventBus.emit(EVENTS.TASK_DELETED, { task, actor });
    return { message: 'Tarea eliminada correctamente' };
  }

  // ── Tareas vencidas (para cron/job) ─────────────────────
  async checkOverdueTasks() {
    const tasks = await TaskRepository.findOverdue();
    if (tasks.length) eventBus.emit(EVENTS.TASK_DUE_SOON, { tasks });
    return tasks.length;
  }
}

module.exports = new TaskService();
