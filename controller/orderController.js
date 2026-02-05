const Order = require('../models/order');
const Product = require('../models/product');
const User = require('../models/user');

// Create order from cart
exports.createOrder = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).populate('cart.product');

        if (!user.cart || user.cart.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cart is empty'
            });
        }

        const { shippingAddress, paymentMethod, notes } = req.body;

        // Build order items from cart
        const items = [];
        for (const cartItem of user.cart) {
            const product = cartItem.product;

            // Check stock
            if (product.stock < cartItem.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${product.name}. Available: ${product.stock}`
                });
            }

            items.push({
                product: product._id,
                name: product.name,
                price: product.discountPrice || product.price,
                quantity: cartItem.quantity
            });

            // Reduce stock
            await Product.findByIdAndUpdate(product._id, {
                $inc: { stock: -cartItem.quantity }
            });
        }

        // Create order
        const order = new Order({
            user: req.user.id,
            items,
            shippingAddress: shippingAddress || user.profile?.address,
            paymentMethod: paymentMethod || 'card',
            notes
        });

        order.calculateTotals();
        await order.save();

        // Clear user's cart
        user.cart = [];
        user.orderHistory.push({
            order: order._id,
            orderedAt: order.orderedAt,
            totalAmount: order.totalAmount
        });
        await user.save();

        res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            data: order
        });
    } catch (error) {
        next(error);
    }
};

// Get current user's orders
exports.getMyOrders = async (req, res, next) => {
    try {
        const orders = await Order.find({ user: req.user.id })
            .populate('items.product', 'name images')
            .sort('-orderedAt');

        res.json({
            success: true,
            data: orders
        });
    } catch (error) {
        next(error);
    }
};

// Get single order by ID
exports.getOrderById = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('items.product', 'name images sku')
            .populate('user', 'username email profile');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check if user owns the order or is admin/staff
        if (order.user._id.toString() !== req.user.id &&
            !['admin', 'staff'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this order'
            });
        }

        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        next(error);
    }
};

// Get all orders (admin/staff only)
exports.getAllOrders = async (req, res, next) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const query = {};

        if (status) {
            query.status = status;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [orders, total] = await Promise.all([
            Order.find(query)
                .populate('user', 'username email')
                .populate('items.product', 'name')
                .sort('-orderedAt')
                .skip(skip)
                .limit(parseInt(limit)),
            Order.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: orders,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        next(error);
    }
};

// Update order status (admin/staff only)
exports.updateOrderStatus = async (req, res, next) => {
    try {
        const { status, trackingNumber } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        order.status = status;

        if (trackingNumber) {
            order.trackingNumber = trackingNumber;
        }

        if (status === 'shipped') {
            order.shippedAt = Date.now();
        } else if (status === 'delivered') {
            order.deliveredAt = Date.now();
            order.paymentStatus = 'paid';
        } else if (status === 'cancelled') {
            order.cancelledAt = Date.now();

            // Restore stock
            for (const item of order.items) {
                await Product.findByIdAndUpdate(item.product, {
                    $inc: { stock: item.quantity }
                });
            }
        }

        await order.save();

        res.json({
            success: true,
            message: 'Order status updated',
            data: order
        });
    } catch (error) {
        next(error);
    }
};

// Cancel order (user can cancel pending orders)
exports.cancelOrder = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check ownership
        if (order.user.toString() !== req.user.id &&
            !['admin', 'staff'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to cancel this order'
            });
        }

        // Can only cancel pending or confirmed orders
        if (!['pending', 'confirmed'].includes(order.status)) {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel order in current status'
            });
        }

        order.status = 'cancelled';
        order.cancelledAt = Date.now();

        // Restore stock
        for (const item of order.items) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { stock: item.quantity }
            });
        }

        await order.save();

        res.json({
            success: true,
            message: 'Order cancelled successfully',
            data: order
        });
    } catch (error) {
        next(error);
    }
};
