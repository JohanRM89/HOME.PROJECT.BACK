const router = require('express').Router();
const FamilyController = require('../controllers/FamilyController');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);

 router.post('/',  FamilyController.createFamily);
 router.post('/join',  FamilyController.joinFamily);
 router.get('/:id',  FamilyController.getFamily);
 router.delete('/family_group/:memberId',  FamilyController.removeMember);

module.exports = router;
