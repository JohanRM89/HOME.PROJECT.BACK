const router = require('express').Router();
const TaskController = require('../controllers/TaskController');
const Task_CommentController = require('../controllers/Task_CommentController');
const { authenticate } = require('../middlewares/auth.middleware');
const { taskRules } = require('../middlewares/validate.middleware');

// Todas requieren autenticación
router.use(authenticate);

router.get('/', taskRules.listQuery, TaskController.index);
router.get('/obtenerById/:id', taskRules.idParam, TaskController.show);
router.get('/all_task_by_group/:id', taskRules.idParam, TaskController.show_all);
router.post('/', taskRules.create, TaskController.create);
router.put('/:id', taskRules.update, TaskController.update);
router.put('/:id/status', taskRules.changeStatus, TaskController.changeStatus);
router.delete('/:id', taskRules.idParam, TaskController.destroy);

router.get('/comments/task/:task_id', Task_CommentController.getTaskCommentsByTask);
router.get('/comments/group/:group_id', Task_CommentController.getTaskCommentsByGroup);
router.post('/comments', Task_CommentController.createTaskComment);
router.delete('/comments/:id/:task_id', Task_CommentController.deleteTaskComment);

router.get('/familias/:groupId/calendario', authenticate, TaskController.getCalendar);


module.exports = router;
