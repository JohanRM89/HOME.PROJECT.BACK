const Task_CommentRepository = require('../repositories/Task_CommentRepository');

class Task_CommentService{

    async createTaskComment (data){
        const taskComment = await Task_CommentRepository.create(
            {
                task_id:data.task_id,
                user_id:data.user_id,
                content:data.content
            }
        )

    }


}