const router                 = require('express').Router();
const NotificationController = require('../controllers/NotificationController');
const ReportController       = require('../controllers/ReportController');
const { authenticate }       = require('../middlewares/auth.middleware');
const { param }              = require('express-validator');

router.use(authenticate);

// Notificaciones
router.get('/notifications',            NotificationController.index);
router.patch('/notifications/read-all', NotificationController.markAllRead);
router.patch('/notifications/:id/read', NotificationController.markRead);

// Reportes por grupo
router.post('/groups/:groupId/reports',  ReportController.generate);
router.get('/groups/:groupId/reports',   ReportController.index);

module.exports = router;
