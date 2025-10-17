const { Router } = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/authorizeMiddleware');
const router = Router();

router.post('/signup', authController.publicSignup);
router.post('/admin/signup',authMiddleware.authenticate,authorize(['admin']),authController.adminSignup);
router.post('/login', authController.loginUser);
router.get('/', authMiddleware.authenticate, authorize(['admin']), authController.getAllUsers);
router.post('/logout', authMiddleware.authenticate, authController.logoutUser);
router.get('/:id',authMiddleware.authenticate,authorize(['admin','customer']), authController.getUserById);
router.put('/:id',authMiddleware.authenticate,authorize(['admin','customer']),authController.updateUser);
router.delete('/:id',authMiddleware.authenticate,authorize(['admin','customer']),authController.deleteUser);

module.exports = router;