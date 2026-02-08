const express = require('express');
const router = express.Router();
const productController = require('../controller/productController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', productController.getAllProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/low-stock', protect, authorize('admin', 'staff'), productController.getLowStockProducts);
router.get('/recent', productController.getRecentProducts);
router.get('/category/:categoryId', productController.getProductsByCategory);
router.get('/:id', productController.getProductById);
router.post('/', protect, authorize('admin', 'staff'), productController.createProduct);
router.put('/:id', protect, authorize('admin', 'staff'), productController.updateProduct);
router.delete('/:id', protect, authorize('admin'), productController.deleteProduct);
router.patch('/:id/stock', protect, authorize('admin', 'staff'), productController.updateStock);
router.post('/:id/rating', protect, productController.addRating);

module.exports = router;