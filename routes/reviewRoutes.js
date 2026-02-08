const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const Order = require('../models/order');
const { protect, authorize } = require('../middleware/auth');

router.get('/product/:productId', async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.productId)
            .select('ratings averageRating')
            .populate('ratings.user', 'username profile.firstName profile.lastName');

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Sort reviews by date (newest first)
        const reviews = product.ratings.sort((a, b) => b.createdAt - a.createdAt);

        res.json({
            success: true,
            count: reviews.length,
            averageRating: product.averageRating,
            data: reviews
        });
    } catch (error) {
        next(error);
    }
});

router.post('/product/:productId', protect, async (req, res, next) => {
    try {
        const { rating, review } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5'
            });
        }

        const product = await Product.findById(req.params.productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Verify user has purchased this product
        /*
        const hasPurchased = await Order.findOne({
            user: req.user.id,
            'items.product': req.params.productId,
            status: { $in: ['delivered', 'confirmed'] }
        });

        if (!hasPurchased) {
            return res.status(403).json({
                success: false,
                message: 'You can only review products you have purchased'
            });
        }
        */

        // Check if user already reviewed
        const existingReview = product.ratings.find(
            r => r.user.toString() === req.user.id
        );

        if (existingReview) {
            // Update existing review
            existingReview.rating = rating;
            existingReview.review = review;
            existingReview.createdAt = Date.now();
        } else {
            // Add new review
            product.ratings.push({
                user: req.user.id,
                rating,
                review
            });
        }

        product.updateAverageRating();
        await product.save();

        res.status(201).json({
            success: true,
            message: existingReview ? 'Review updated successfully' : 'Review added successfully',
            data: {
                averageRating: product.averageRating,
                totalReviews: product.ratings.length
            }
        });
    } catch (error) {
        next(error);
    }
});

router.put('/:reviewId', protect, async (req, res, next) => {
    try {
        const { rating, review, productId } = req.body;

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: 'Product ID is required'
            });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const reviewToUpdate = product.ratings.id(req.params.reviewId);
        if (!reviewToUpdate) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        // Check if user owns the review
        if (reviewToUpdate.user.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this review'
            });
        }

        if (rating) reviewToUpdate.rating = rating;
        if (review !== undefined) reviewToUpdate.review = review;
        reviewToUpdate.createdAt = Date.now();

        product.updateAverageRating();
        await product.save();

        res.json({
            success: true,
            message: 'Review updated successfully',
            data: reviewToUpdate
        });
    } catch (error) {
        next(error);
    }
});

router.delete('/:reviewId', protect, async (req, res, next) => {
    try {
        const { productId } = req.body;

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: 'Product ID is required'
            });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const review = product.ratings.id(req.params.reviewId);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        // Check authorization (owner or admin)
        if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this review'
            });
        }

        product.ratings.pull(req.params.reviewId);
        product.updateAverageRating();
        await product.save();

        res.json({
            success: true,
            message: 'Review deleted successfully'
        });
    } catch (error) {
        next(error);
    }
});

router.get('/user/my-reviews', protect, async (req, res, next) => {
    try {
        const products = await Product.find({
            'ratings.user': req.user.id
        }).select('name images ratings');

        const userReviews = products.map(product => {
            const userRating = product.ratings.find(
                r => r.user.toString() === req.user.id
            );
            return {
                reviewId: userRating._id,
                product: {
                    id: product._id,
                    name: product.name,
                    image: product.images?.[0]
                },
                rating: userRating.rating,
                review: userRating.review,
                createdAt: userRating.createdAt
            };
        });

        res.json({
            success: true,
            count: userReviews.length,
            data: userReviews
        });
    } catch (error) {
        next(error);
    }
});

router.get('/pending', protect, async (req, res, next) => {
    try {
        // Get all delivered orders
        const orders = await Order.find({
            user: req.user.id,
            status: 'delivered'
        }).populate('items.product', 'name images');

        // Get all products user has reviewed
        const reviewedProducts = await Product.find({
            'ratings.user': req.user.id
        }).select('_id');

        const reviewedProductIds = reviewedProducts.map(p => p._id.toString());

        // Find products from orders that haven't been reviewed
        const pendingReviews = [];
        orders.forEach(order => {
            order.items.forEach(item => {
                if (item.product && !reviewedProductIds.includes(item.product._id.toString())) {
                    const existing = pendingReviews.find(
                        p => p.product._id.toString() === item.product._id.toString()
                    );
                    if (!existing) {
                        pendingReviews.push({
                            product: item.product,
                            orderId: order._id,
                            orderDate: order.orderedAt
                        });
                    }
                }
            });
        });

        res.json({
            success: true,
            count: pendingReviews.length,
            data: pendingReviews
        });
    } catch (error) {
        next(error);
    }
});

router.get('/stats', protect, authorize('admin', 'staff'), async (req, res, next) => {
    try {
        const products = await Product.find().select('ratings averageRating');

        let totalReviews = 0;
        let totalRating = 0;
        const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

        products.forEach(product => {
            product.ratings.forEach(rating => {
                totalReviews++;
                totalRating += rating.rating;
                ratingDistribution[rating.rating]++;
            });
        });

        const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;

        res.json({
            success: true,
            data: {
                totalReviews,
                averageRating: averageRating.toFixed(2),
                ratingDistribution,
                productsWithReviews: products.filter(p => p.ratings.length > 0).length,
                totalProducts: products.length
            }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;