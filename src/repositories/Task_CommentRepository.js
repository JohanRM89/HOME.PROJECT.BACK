const db = require('../config/database');

class Task_CommentRepository extends BaseRepository {


    async deleteTask_Comment(task_id, user_id, id) {
        await db.query(
            `DELETE FROM task_comments WHERE task_id=$1 AND user_id=$2 AND id=$3`,
            [task_id, user_id, id]
        )
    };

}