const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Order = require('../models/order');
const Product = require('../models/product');
const User = require('../models/user');

router.get('/dashboard', protect, authorize('admin', 'staff'), async (req, res, next) => {
    try {
        const [totalProducts, totalUsers, totalOrders, orders] = await Promise.all([
            Product.countDocuments(),
            User.countDocuments({ role: 'customer' }),
            Order.countDocuments(),
            Order.find({ paymentStatus: 'paid' })
        ]);

        const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        const pendingOrders = await Order.countDocuments({ status: 'pending' });

        res.json({
            success: true,
            data: {
                overview: {
                    totalProducts,
                    totalUsers,
                    totalOrders,
                    totalRevenue,
                    pendingOrders
                }
            }
        });
    } catch (error) {
        next(error);
    }
});

router.get('/popular-products', protect, authorize('admin', 'staff'), async (req, res, next) => {
    try {
        const orders = await Order.find({ status: { $ne: 'cancelled' } });

        const productSales = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                const productId = item.product?.toString() || item.name;
                if (!productSales[productId]) {
                    productSales[productId] = {
                        name: item.name,
                        totalQuantitySold: 0,
                        totalRevenue: 0
                    };
                }
                productSales[productId].totalQuantitySold += item.quantity;
                productSales[productId].totalRevenue += item.total || (item.price * item.quantity);
            });
        });

        const popularProducts = Object.values(productSales)
            .sort((a, b) => b.totalQuantitySold - a.totalQuantitySold)
            .slice(0, 10);

        res.json({
            success: true,
            data: popularProducts
        });
    } catch (error) {
        next(error);
    }
});

router.get('/monthly-revenue', protect, authorize('admin', 'staff'), async (req, res, next) => {
    try {
        const year = parseInt(req.query.year) || new Date().getFullYear();

        const monthlyRevenue = await Order.aggregate([
            {
                $match: {
                    paymentStatus: 'paid',
                    orderedAt: {
                        $gte: new Date(year, 0, 1),
                        $lt: new Date(year + 1, 0, 1)
                    }
                }
            },
            {
                $group: {
                    _id: { $month: '$orderedAt' },
                    revenue: { $sum: '$totalAmount' },
                    orderCount: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const months = Array.from({ length: 12 }, (_, i) => {
            const monthData = monthlyRevenue.find(m => m._id === i + 1);
            return {
                month: i + 1,
                monthName: new Date(year, i).toLocaleString('default', { month: 'short' }),
                revenue: monthData?.revenue || 0,
                orderCount: monthData?.orderCount || 0
            };
        });

        res.json({
            success: true,
            data: { year, months }
        });
    } catch (error) {
        next(error);
    }
});

router.get('/sales-report', protect, authorize('admin', 'staff'), async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;

        const dateFilter = {};
        if (startDate) dateFilter.$gte = new Date(startDate);
        if (endDate) dateFilter.$lte = new Date(endDate);

        const query = Object.keys(dateFilter).length > 0
            ? { orderedAt: dateFilter, paymentStatus: 'paid' }
            : { paymentStatus: 'paid' };

        const orders = await Order.find(query);

        const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
        const totalOrders = orders.length;
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        res.json({
            success: true,
            data: {
                totalRevenue,
                totalOrders,
                averageOrderValue,
                period: { startDate, endDate }
            }
        });
    } catch (error) {
        next(error);
    }
});

router.get('/customer-activity', protect, authorize('admin', 'staff'), async (req, res, next) => {
    try {
        const topCustomers = await Order.aggregate([
            { $match: { paymentStatus: 'paid' } },
            {
                $group: {
                    _id: '$user',
                    totalSpent: { $sum: '$totalAmount' },
                    orderCount: { $sum: 1 }
                }
            },
            { $sort: { totalSpent: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: '$user' },
            {
                $project: {
                    username: '$user.username',
                    email: '$user.email',
                    totalSpent: 1,
                    orderCount: 1
                }
            }
        ]);

        res.json({
            success: true,
            data: topCustomers
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
