// ============================================================
// Patrón Strategy — algoritmos de filtrado intercambiables
// ============================================================

class FilterByStatus {
  apply(filters, value) { return { ...filters, status: value }; }
}

class FilterByPriority {
  apply(filters, value) { return { ...filters, priority: value }; }
}

class FilterByAssignee {
  apply(filters, value) { return { ...filters, assignedTo: value }; }
}

class FilterByGroup {
  apply(filters, value) { return { ...filters, groupId: value }; }
}

// Context — aplica la estrategia elegida
class TaskFilterContext {
  constructor() {
    this._strategies = {
      status:     new FilterByStatus(),
      priority:   new FilterByPriority(),
      assignedTo: new FilterByAssignee(),
      groupId:    new FilterByGroup(),
    };
  }

  buildFilters(query = {}) {
    let filters = {};
    for (const [key, value] of Object.entries(query)) {
      if (this._strategies[key] && value) {
        filters = this._strategies[key].apply(filters, value);
      }
    }
    console.log("fo",filters)
    return filters;
  }
}

module.exports = new TaskFilterContext();
