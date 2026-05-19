const router                 = require('express').Router();
const NotificationController = require('../controllers/NotificationController');
const ReportController       = require('../controllers/ReportController');
const { authenticate }       = require('../middlewares/auth.middleware');
const { param }              = require('express-validator');

router.use(authenticate);

// Notificaciones
router.get('/notifications/member/:id',            NotificationController.index);
router.patch('/notifications/read-all', NotificationController.markAllRead);
router.patch('/notifications/:id/read', NotificationController.markRead);

// Reportes por grupo
router.post('/groups/:groupId/reports',  ReportController.generate);
router.get('/groups/:groupId/reports',   ReportController.index);
router.get('/groups_v2/:groupId/reports',   ReportController.index_neew);

module.exports = router;
