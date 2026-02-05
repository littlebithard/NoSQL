const User = require('../models/user');
const Product = require('../models/product');

// Get cart
exports.getCart = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id)
            .populate('cart.product', 'name price discountPrice images stock status');

        const cart = user.cart.filter(item => item.product); // Filter out deleted products

        // Calculate totals
        let subtotal = 0;
        const items = cart.map(item => {
            const price = item.product.discountPrice || item.product.price;
            const itemTotal = price * item.quantity;
            subtotal += itemTotal;
            return {
                _id: item._id,
                product: item.product,
                quantity: item.quantity,
                price,
                total: itemTotal
            };
        });

        const tax = subtotal * 0.08;
        const shipping = subtotal >= 500 ? 0 : 50;
        const total = subtotal + tax + shipping;

        res.json({
            success: true,
            data: {
                items,
                subtotal,
                tax,
                shipping,
                total,
                itemCount: items.reduce((sum, item) => sum + item.quantity, 0)
            }
        });
    } catch (error) {
        next(error);
    }
};

// Add to cart
exports.addToCart = async (req, res, next) => {
    try {
        const { productId, quantity = 1 } = req.body;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        if (product.stock < quantity) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient stock'
            });
        }

        const user = await User.findById(req.user.id);

        // Check if product already in cart
        const existingItem = user.cart.find(
            item => item.product.toString() === productId
        );

        if (existingItem) {
            const newQuantity = existingItem.quantity + quantity;
            if (newQuantity > product.stock) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot add more. Only ${product.stock} in stock.`
                });
            }
            existingItem.quantity = newQuantity;
        } else {
            user.cart.push({ product: productId, quantity });
        }

        await user.save();

        res.json({
            success: true,
            message: 'Product added to cart',
            data: { cartItemCount: user.cart.length }
        });
    } catch (error) {
        next(error);
    }
};

// Update cart item quantity
exports.updateCartItem = async (req, res, next) => {
    try {
        const { quantity } = req.body;
        const { itemId } = req.params;

        const user = await User.findById(req.user.id);
        const cartItem = user.cart.id(itemId);

        if (!cartItem) {
            return res.status(404).json({
                success: false,
                message: 'Cart item not found'
            });
        }

        const product = await Product.findById(cartItem.product);
        if (quantity > product.stock) {
            return res.status(400).json({
                success: false,
                message: `Only ${product.stock} items in stock`
            });
        }

        if (quantity <= 0) {
            user.cart.pull(itemId);
        } else {
            cartItem.quantity = quantity;
        }

        await user.save();

        res.json({
            success: true,
            message: 'Cart updated'
        });
    } catch (error) {
        next(error);
    }
};

// Remove from cart
exports.removeFromCart = async (req, res, next) => {
    try {
        const { itemId } = req.params;

        const user = await User.findById(req.user.id);
        user.cart.pull(itemId);
        await user.save();

        res.json({
            success: true,
            message: 'Item removed from cart'
        });
    } catch (error) {
        next(error);
    }
};

// Clear cart
exports.clearCart = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        user.cart = [];
        await user.save();

        res.json({
            success: true,
            message: 'Cart cleared'
        });
    } catch (error) {
        next(error);
    }
};
