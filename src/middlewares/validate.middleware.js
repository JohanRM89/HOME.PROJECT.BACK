const { validationResult, body, param, query } = require('express-validator');
const ResponseView = require('../views/responses/ResponseView');

// ── Runner: ejecuta las reglas y responde si hay errores ─────
const validate = (rules) => [
  ...rules,
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ResponseView.validationError(res, errors.array().map(e => ({
        field: e.path,
        message: e.msg,
      })));
    }
    next();
  },
];

// ── Reglas de Auth ────────────────────────────────────────────
const authRules = {
  register: validate([
    body('name').trim().notEmpty().withMessage('El nombre es requerido')
      .isLength({ min: 2, max: 100 }).withMessage('Nombre: 2-100 caracteres'),
    body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Contraseña mínimo 8 caracteres'),
  ]),

  login: validate([
    body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
    body('password').notEmpty().withMessage('Contraseña requerida'),
  ]),

  resetRequest: validate([
    body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
  ]),

  resetPassword: validate([
    body('token').notEmpty().withMessage('Token requerido'),
    body('password').isLength({ min: 8 }).withMessage('Contraseña mínimo 8 caracteres'),
  ]),
};

// ── Reglas de Tareas ──────────────────────────────────────────
const taskRules = {
  create: validate([
    body('title').trim().notEmpty().withMessage('El título es requerido')
      .isLength({ max: 200 }).withMessage('Máximo 200 caracteres'),
    body('priority').optional()
      .isIn(['low', 'medium', 'high']).withMessage('Prioridad inválida'),
    body('due_date').optional({ nullable: true })
      .isISO8601().withMessage('Fecha inválida (formato YYYY-MM-DD)'),
    body('assigned_to').optional({ nullable: true })
      .isUUID().withMessage('ID de responsable inválido'),
    body('group_id').optional({ nullable: true })
      .isUUID().withMessage('ID de grupo inválido'),
  ]),

  update: validate([
    param('id').isUUID().withMessage('ID de tarea inválido'),
    body('title').optional().trim()
      .isLength({ min: 1, max: 200 }).withMessage('Título: 1-200 caracteres'),
    body('priority').optional()
      .isIn(['low', 'medium', 'high']).withMessage('Prioridad inválida'),
    body('due_date').optional({ nullable: true })
      .isISO8601().withMessage('Fecha inválida'),
    body('assigned_to').optional({ nullable: true })
      .isUUID().withMessage('ID de responsable inválido'),
  ]),

  changeStatus: validate([
    param('id').isUUID().withMessage('ID de tarea inválido'),
    body('status').isIn(['pending', 'in_progress', 'completed'])
      .withMessage('Estado inválido'),
  ]),

  idParam: validate([
    param('id').isUUID().withMessage('ID inválido'),
  ]),

  listQuery: validate([
    query('status').optional().isIn(['pending', 'in_progress', 'completed']),
    query('priority').optional().isIn(['low', 'medium', 'high']),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(), 
    query('assignedTo').exists().withMessage('assignedTo es obligatorio'),
    query('groupId').optional({ nullable: true })
      .isUUID().withMessage('ID de grupo inválido'), 
  ]),
};

module.exports = { authRules, taskRules };
