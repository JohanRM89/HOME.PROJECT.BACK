const router = require('express').Router();
const FamilyController = require('../controllers/FamilyController');

const CategoryController = require('../controllers/CategoryController');

const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);

router.post('/', FamilyController.createFamily);
router.post('/join', FamilyController.joinFamily);
router.get('/:id', FamilyController.getFamily);
router.delete('/family_group/:memberId/:user_id', FamilyController.removeMember);
router.get('/categories/:group_id', CategoryController.getCategories);
router.post('/create_categories',CategoryController.createCategories);
module.exports = router;
