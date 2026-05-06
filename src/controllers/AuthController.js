const AuthService  = require('../services/AuthService');
const ResponseView = require('../views/responses/ResponseView');

// ============================================================
// Controlador de Autenticación (MVC — Controlador)
// Solo delega a Service y usa View para responder
// ============================================================
class AuthController {
  async register(req, res, next) {
    try {
      const user = await AuthService.register(req.body);
      return ResponseView.created(res, user, 'Usuario registrado correctamente');
    } catch (err) { next(err); }
  }

  async login(req, res, next) {
    try {
      const meta   = { ip: req.ip, ua: req.headers['user-agent'] };
      const result = await AuthService.login({ ...req.body, meta });
      return ResponseView.success(res, result, 'Sesión iniciada correctamente');
    } catch (err) { next(err); }
  }

  async logout(req, res, next) {
    try {
      await AuthService.logout(req.token);
      return ResponseView.success(res, null, 'Sesión cerrada correctamente');
    } catch (err) { next(err); }
  }

  async me(req, res) {

    ///Conectar la parte de las familias 
    return ResponseView.success(res, req.user, 'Perfil del usuario');
  }

  async requestPasswordReset(req, res, next) {
    try {
      const result = await AuthService.requestPasswordReset(req.body.email);
      return ResponseView.success(res, result, result.message);
    } catch (err) { next(err); }
  }

  async resetPassword(req, res, next) {
    try {
      const { token, password } = req.body;
      const result = await AuthService.resetPassword(token, password);
      return ResponseView.success(res, null, result.message);
    } catch (err) { next(err); }
  }
}

module.exports = new AuthController();
