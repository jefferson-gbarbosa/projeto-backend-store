const { Router } = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const router = Router();

router.post('/signup', authController.createUser);
router.post('/token', authController.loginUser);
router.get('/:id', authController.getUserById);
router.put('/:id',authMiddleware.authenticate, authController.updateUser);
router.delete('/:id',authMiddleware.authenticate,authController.deleteUser);

module.exports = router;