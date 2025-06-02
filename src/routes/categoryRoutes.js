const { Router } = require('express');
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middleware/authMiddleware');
const router = Router();

router.get('/search', categoryController.search);
router.get('/:id', categoryController.getCategoryById);
router.post('/create-category', authMiddleware.authenticate, categoryController.createCategory);
router.put('/:id', authMiddleware.authenticate, categoryController.updateCategory);
router.delete('/:id', authMiddleware.authenticate, categoryController.deleteCategory);

module.exports = router;