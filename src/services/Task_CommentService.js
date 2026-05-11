const Task_CommentRepository = require('../repositories/Task_CommentRepository');

class Task_CommentService{

    async createTaskComment (data){
        const taskComment = await Task_CommentRepository.create(
            {
                task_id:data.task_id,
                user_id:data.user_id,
                content:data.content
            }
        );
        return taskComment;

    }
    async deleteTaskComment(task_id, user_id, id){
      const reqDele =  await Task_CommentRepository.deleteTask_Comment(task_id, user_id, id);
      //POner las notifiaciones
      return reqDele;
    }
    async getTaskCommentsByTask(task_id){
        const taskComments = await Task_CommentRepository.getTask_Comments_ByTask(task_id);
        return taskComments;
  //POner las notifiaciones
    }
    async getTaskCommentsByGroup(group_id){
        const taskComments = await Task_CommentRepository.getTask_Comments_ByGroup(group_id);
        return taskComments;
  //POner las notifiaciones
    }


}