const router         = require('express').Router();
const AuthController = require('../controllers/AuthController');
const { authenticate } = require('../middlewares/auth.middleware');
const { authRules }  = require('../middlewares/validate.middleware');

// Públicas
router.post('/register',       authRules.register,      AuthController.register);
router.post('/login',          authRules.login,         AuthController.login);
router.post('/reset-request',  authRules.resetRequest,  AuthController.requestPasswordReset);
router.post('/reset-password', authRules.resetPassword, AuthController.resetPassword);

// Protegidas
router.get('/me',     authenticate, AuthController.me);
router.post('/logout', authenticate, AuthController.logout);

module.exports = router;
