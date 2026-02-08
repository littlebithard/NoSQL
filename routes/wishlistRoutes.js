const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Product = require('../models/product');
const { protect } = require('../middleware/auth');

router.get('/', protect, async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id)
            .populate('wishlist.product', 'name price discountPrice images stock status brand category')
            .populate('wishlist.product.category', 'name');

        const wishlist = user.wishlist.filter(item => item.product); // Filter deleted products

        res.json({
            success: true,
            count: wishlist.length,
            data: wishlist
        });
    } catch (error) {
        next(error);
    }
});

router.post('/', protect, async (req, res, next) => {
    try {
        const { productId } = req.body;

        // Verify product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const user = await User.findById(req.user.id);

        // Check if already in wishlist
        const existingItem = user.wishlist.find(
            item => item.product.toString() === productId
        );

        if (existingItem) {
            return res.status(400).json({
                success: false,
                message: 'Product already in wishlist'
            });
        }

        user.wishlist.push({ product: productId });
        await user.save();

        res.status(201).json({
            success: true,
            message: 'Product added to wishlist',
            data: { wishlistCount: user.wishlist.length }
        });
    } catch (error) {
        next(error);
    }
});

router.delete('/:itemId', protect, async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        const wishlistItem = user.wishlist.id(req.params.itemId);
        if (!wishlistItem) {
            return res.status(404).json({
                success: false,
                message: 'Item not found in wishlist'
            });
        }

        user.wishlist.pull(req.params.itemId);
        await user.save();

        res.json({
            success: true,
            message: 'Product removed from wishlist'
        });
    } catch (error) {
        next(error);
    }
});

router.delete('/', protect, async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        user.wishlist = [];
        await user.save();

        res.json({
            success: true,
            message: 'Wishlist cleared'
        });
    } catch (error) {
        next(error);
    }
});

router.post('/:itemId/move-to-cart', protect, async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        const wishlistItem = user.wishlist.id(req.params.itemId);
        if (!wishlistItem) {
            return res.status(404).json({
                success: false,
                message: 'Item not found in wishlist'
            });
        }

        const productId = wishlistItem.product;

        // Verify product still exists and is in stock
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        if (product.stock < 1) {
            return res.status(400).json({
                success: false,
                message: 'Product is out of stock'
            });
        }

        // Add to cart
        const existingCartItem = user.cart.find(
            item => item.product.toString() === productId.toString()
        );

        if (existingCartItem) {
            existingCartItem.quantity += 1;
        } else {
            user.cart.push({ product: productId, quantity: 1 });
        }

        // Remove from wishlist
        user.wishlist.pull(req.params.itemId);

        await user.save();

        res.json({
            success: true,
            message: 'Product moved to cart'
        });
    } catch (error) {
        next(error);
    }
});

router.get('/check/:productId', protect, async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        const inWishlist = user.wishlist.some(
            item => item.product.toString() === req.params.productId
        );

        res.json({
            success: true,
            data: { inWishlist }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;