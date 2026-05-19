const NotificationRepository = require('../repositories/NotificationRepository');
const ResponseView = require('../views/responses/ResponseView');

class NotificationController {
  async index(req, res, next) {
    try {


      const onlyUnread = req.query.unread === 'true';
      const notifs = await NotificationRepository.findForUser(req.user.id,
        req.params.id,
        onlyUnread);
      return ResponseView.success(res, notifs);
    } catch (err) { next(err); }
  }

  async markAllRead(req, res, next) {
    try {
      const count = await NotificationRepository.markAllRead(req.user.id);
      return ResponseView.success(res, { updated: count }, `${count} notificaciones marcadas como leídas`);
    } catch (err) { next(err); }
  }

  async markRead(req, res, next) {
    try {
      const notif = await NotificationRepository.update(req.params.id, { is_read: true });
      if (!notif) return ResponseView.notFound(res);
      return ResponseView.success(res, notif);
    } catch (err) { next(err); }
  }
}

module.exports = new NotificationController();
