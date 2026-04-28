const TaskService  = require('../services/TaskService');
const ResponseView = require('../views/responses/ResponseView');

class TaskController {
  async index(req, res, next) {
    try {
      const { page = 1, limit = 20, ...filters } = req.query;
      console.log("req.query",req.query)
      const result = await TaskService.list(filters, { page: +page, limit: +limit });
      return ResponseView.paginated(res, {
        data:       result.tasks,
        total:      result.total,
        page:       result.page,
        totalPages: result.totalPages,
      });
    } catch (err) { next(err); }
  }

  async show(req, res, next) {
    try {
      const task = await TaskService.getById(req.params.id);
      return ResponseView.success(res, task);
    } catch (err) { next(err); }
  }

  async create(req, res, next) {
    try {
      const task = await TaskService.create(req.body, req.user);
      return ResponseView.created(res, task, 'Tarea creada correctamente');
    } catch (err) { next(err); }
  }

  async update(req, res, next) {
    try {
      const task = await TaskService.update(req.params.id, req.body, req.user);
      return ResponseView.success(res, task, 'Tarea actualizada correctamente');
    } catch (err) { next(err); }
  }

  async changeStatus(req, res, next) {
    try {
      const task = await TaskService.changeStatus(req.params.id, req.body.status, req.user);
      return ResponseView.success(res, task, 'Estado actualizado correctamente');
    } catch (err) { next(err); }
  }

  async destroy(req, res, next) {
    try {
      const result = await TaskService.remove(req.params.id, req.user);
      return ResponseView.success(res, null, result.message);
    } catch (err) { next(err); }
  }
}

module.exports = new TaskController();
