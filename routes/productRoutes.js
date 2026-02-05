const express = require('express');
const router = express.Router();
const productController = require('../controller/productController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', productController.getAllProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/:id', productController.getProductById);
router.get('/category/:categoryId', productController.getProductsByCategory);
router.post('/', protect, authorize('admin', 'staff'), productController.createProduct);
router.put('/:id', protect, authorize('admin', 'staff'), productController.updateProduct);
router.delete('/:id', protect, authorize('admin'), productController.deleteProduct);
router.post('/:id/rating', protect, productController.addRating);

module.exports = router;
