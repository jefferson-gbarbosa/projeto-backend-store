const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/authorizeMiddleware');

router.get('/search', productController.searchProducts);
router.get('/:id', productController.getProductById);
router.get('/media/product/:productSlug/image/:imageId', productController.serveProductImage);
router.post('/create-product',authMiddleware.authenticate,authorize(['admin','customer']), productController.createProduct);
router.put('/:id', authMiddleware.authenticate,authorize(['admin','customer']), productController.updateProduct);
router.delete('/:id', authMiddleware.authenticate,authorize(['admin','customer']), productController.deleteProduct);

module.exports = router;