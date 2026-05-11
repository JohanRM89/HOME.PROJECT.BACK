const Task_CommentRepository = require("../repositories/Task_CommentRepository");
const ResponseView = require('../views/responses/ResponseView');

class Task_CommentController {
  async createTaskComment(req, res,next) {
    try {
      const taskComment = await Task_CommentRepository.create(req.body);
      return ResponseView.created(
        res,
        taskComment,
        "Comentario creado exitosamente",
      );
    } catch (e) {
      next(e);
    }
  }
  async deleteTaskComment(req, res,next) {
    try {
      const { task_id, id } = req.params;
      const user_id = req.user.id;
      const result = await Task_CommentRepository.deleteTask_Comment(
        task_id,
        user_id,
        id,
      );
      return ResponseView.success(res, null, result.message);
    } catch (e) {
      next(e);
    }
  }
  async getTaskCommentsByTask(req, res,next) {
    try {
      const { task_id } = req.params;
      const taskComments =
        await Task_CommentRepository.getTask_Comments_ByTask(task_id);
      return ResponseView.success(res, taskComments);
    } catch (e) {
      next(e);
    }
  }
  async getTaskCommentsByGroup(req, res,next) {
    try {
      const { group_id } = req.params;
      const taskComments =
        await Task_CommentRepository.getTask_Comments_ByGroup(group_id);
      return ResponseView.success(res, taskComments);
    } catch (e) {
      next(e);
    }
  }
}
module.exports = new Task_CommentController();
