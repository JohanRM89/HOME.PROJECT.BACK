// ============================================================
// Patrón Observer — desacopla la emisión de eventos
// del manejo de notificaciones (SOLID: SRP, OCP)
// ============================================================
const { EventEmitter } = require('events');

class AppEventBus extends EventEmitter {
  constructor() {
    super();
    if (AppEventBus.instance) return AppEventBus.instance;
    this.setMaxListeners(30);
    AppEventBus.instance = this;
  }
}

// Eventos disponibles en la aplicación
const EVENTS = Object.freeze({
  TASK_CREATED:        'task:created',
  TASK_UPDATED:        'task:updated',
  TASK_DELETED:        'task:deleted',
  TASK_ASSIGNED:       'task:assigned',
  TASK_STATUS_CHANGED: 'task:status_changed',
  TASK_DUE_SOON:       'task:due_soon',
  USER_REGISTERED:     'user:registered',
  USER_RESET_PASSWORD: 'user:reset_password',
  REPORT_GENERATED:    'report:generated',
});

module.exports = { eventBus: new AppEventBus(), EVENTS };
