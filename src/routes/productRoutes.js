const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/search', productController.searchProducts);
router.get('/:id', productController.getProductById);
router.get('/media/product/:productSlug/image/:imageId', productController.serveProductImage);
router.post('/create-product',authMiddleware.authenticate, productController.createProduct);
router.put('/:id', authMiddleware.authenticate, productController.updateProduct);
router.delete('/:id', authMiddleware.authenticate, productController.deleteProduct);

module.exports = router;