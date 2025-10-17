const { Router } = require('express');
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middleware/authMiddleware');
// const authoMiddleware = require('../middleware/authorizeMiddleware');
const { authorize } = require('../middleware/authorizeMiddleware');

const router = Router();

router.get('/search', categoryController.search);
router.get('/:id', categoryController.getCategoryById);
router.post('/create-category', authMiddleware.authenticate,authorize(['admin','customer']), categoryController.createCategory);
router.put('/:id', authMiddleware.authenticate,authorize(['admin','customer']), categoryController.updateCategory);
router.delete('/:id', authMiddleware.authenticate,authorize(['admin','customer']), categoryController.deleteCategory);

module.exports = router;