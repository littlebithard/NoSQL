const express = require('express');
const router = express.Router();

// Import all route modules
const authRoutes = require('./authRoutes');
const productRoutes = require('./productRoutes');
const categoryRoutes = require('./categoryRoutes');
const cartRoutes = require('./cartRoutes');
const orderRoutes = require('./orderRoutes');
const userRoutes = require('./userRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const wishlistRoutes = require('./wishlistRoutes');
const reviewRoutes = require('./reviewRoutes');
const searchRoutes = require('./searchRoutes');
const uploadRoutes = require('./uploadRoutes');
const notificationRoutes = require('./notificationRoutes');

router.use('/auth', authRoutes);              
router.use('/products', productRoutes);        
router.use('/categories', categoryRoutes);     
router.use('/cart', cartRoutes);              
router.use('/orders', orderRoutes);            
router.use('/users', userRoutes);              
router.use('/analytics', analyticsRoutes);     
router.use('/wishlist', wishlistRoutes);       
router.use('/reviews', reviewRoutes);          
router.use('/search', searchRoutes);           
router.use('/upload', uploadRoutes);           
router.use('/notifications', notificationRoutes); 

router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'FurnitureHub API v1.0',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            products: '/api/products',
            categories: '/api/categories',
            cart: '/api/cart',
            orders: '/api/orders',
            users: '/api/users',
            analytics: '/api/analytics',
            wishlist: '/api/wishlist',
            reviews: '/api/reviews',
            search: '/api/search',
            upload: '/api/upload',
            notifications: '/api/notifications'
        }
    });
});

// Health check route
router.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

module.exports = router;