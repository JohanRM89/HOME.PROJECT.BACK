const router         = require('express').Router();
const TaskController = require('../controllers/TaskController');
const { authenticate } = require('../middlewares/auth.middleware');
const { taskRules }  = require('../middlewares/validate.middleware');

// Todas requieren autenticación
router.use(authenticate);

router.get('/',                taskRules.listQuery,   TaskController.index);
router.get('/:id',             taskRules.idParam,     TaskController.show);
router.post('/',               taskRules.create,      TaskController.create);
router.put('/:id',             taskRules.update,      TaskController.update);
router.patch('/:id/status',    taskRules.changeStatus,TaskController.changeStatus);
router.delete('/:id',          taskRules.idParam,     TaskController.destroy);

module.exports = router;
