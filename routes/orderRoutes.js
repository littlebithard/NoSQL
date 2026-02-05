const express = require('express');
const router = express.Router();
const orderController = require('../controller/orderController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, orderController.createOrder);
router.get('/my', protect, orderController.getMyOrders);
router.get('/', protect, authorize('admin', 'staff'), orderController.getAllOrders);
router.get('/:id', protect, orderController.getOrderById);
router.put('/:id/status', protect, authorize('admin', 'staff'), orderController.updateOrderStatus);
router.put('/:id/cancel', protect, orderController.cancelOrder);

module.exports = router;
