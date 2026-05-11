const db = require("../config/database");
const BaseRepository = require("./BaseRepository");

class Task_CommentRepository extends BaseRepository {
      constructor() { super('task_comments'); }

  async deleteTask_Comment(task_id, user_id, id) {
    const data = await db.query(
      `DELETE FROM task_comments WHERE task_id=$1 AND user_id=$2 AND id=$3`,
      [task_id, user_id, id],
    );
    return { data, message: "Comentario eliminado exitosamente" };
  }
  async getTask_Comments_ByGroup(group_id) {
    const result = await db.query(
      `
        SELECT 
        tc.*    FROM task_comments tc
    INNER JOIN tasks t 
        ON tc.task_id = t.id
    WHERE t.group_id = $1
      `,
      [group_id],
    );
    return result.rows;
  }
  async getTask_Comments_ByTask(task_id) {
    const result = await db.query(
      `SELECT * FROM task_comments WHERE task_id=$1`,
      [task_id],
    );
    return result.rows;
  }
}


module.exports = new Task_CommentRepository();