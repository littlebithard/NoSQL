const Product = require('../models/product');
const Category = require('../models/category');

// Get all products with filtering, sorting, pagination
exports.getAllProducts = async (req, res, next) => {
    try {
        const {
            search,
            category,
            minPrice,
            maxPrice,
            status,
            featured,
            sort = '-createdAt',
            page = 1,
            limit = 12
        } = req.query;

        const query = {};

        // Search by name or brand
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { brand: { $regex: search, $options: 'i' } },
                { sku: { $regex: search, $options: 'i' } }
            ];
        }

        // Filter by category
        if (category) {
            query.category = category;
        }

        // Filter by price range
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = parseFloat(minPrice);
            if (maxPrice) query.price.$lte = parseFloat(maxPrice);
        }

        // Filter by status
        if (status) {
            query.status = status;
        }

        // Filter featured products
        if (featured === 'true') {
            query.isFeatured = true;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [products, total] = await Promise.all([
            Product.find(query)
                .populate('category', 'name')
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit)),
            Product.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: products,
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

// Get single product by ID
exports.getProductById = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('category', 'name')
            .populate('ratings.user', 'username');

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        next(error);
    }
};

// Create new product (admin/staff only)
exports.createProduct = async (req, res, next) => {
    try {
        const product = new Product(req.body);
        await product.save();

        // Update category product count
        await Category.findByIdAndUpdate(product.category, {
            $inc: { productCount: 1 }
        });

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: product
        });
    } catch (error) {
        next(error);
    }
};

// Update product (admin/staff only)
exports.updateProduct = async (req, res, next) => {
    try {
        const oldProduct = await Product.findById(req.params.id);
        if (!oldProduct) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: Date.now() },
            { new: true, runValidators: true }
        );

        // Update category counts if category changed
        if (req.body.category && req.body.category !== oldProduct.category.toString()) {
            await Category.findByIdAndUpdate(oldProduct.category, {
                $inc: { productCount: -1 }
            });
            await Category.findByIdAndUpdate(req.body.category, {
                $inc: { productCount: 1 }
            });
        }

        res.json({
            success: true,
            message: 'Product updated successfully',
            data: product
        });
    } catch (error) {
        next(error);
    }
};

// Delete product (admin only)
exports.deleteProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        await Product.findByIdAndDelete(req.params.id);

        // Update category product count
        await Category.findByIdAndUpdate(product.category, {
            $inc: { productCount: -1 }
        });

        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Add rating/review to product
exports.addRating = async (req, res, next) => {
    try {
        const { rating, review } = req.body;
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Check if user already rated
        const existingRating = product.ratings.find(
            r => r.user.toString() === req.user.id
        );

        if (existingRating) {
            existingRating.rating = rating;
            existingRating.review = review;
            existingRating.createdAt = Date.now();
        } else {
            product.ratings.push({
                user: req.user.id,
                rating,
                review
            });
        }

        product.updateAverageRating();
        await product.save();

        res.json({
            success: true,
            message: 'Rating added successfully',
            data: product
        });
    } catch (error) {
        next(error);
    }
};

// Get featured products
exports.getFeaturedProducts = async (req, res, next) => {
    try {
        const products = await Product.find({ isFeatured: true, status: { $ne: 'out_of_stock' } })
            .populate('category', 'name')
            .sort('-averageRating')
            .limit(8);

        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        next(error);
    }
};

// Get products by category
exports.getProductsByCategory = async (req, res, next) => {
    try {
        const products = await Product.find({ category: req.params.categoryId })
            .populate('category', 'name')
            .sort('-createdAt');

        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        next(error);
    }
};

// Get low stock products (stock <= 5)
exports.getLowStockProducts = async (req, res, next) => {
    try {
        const products = await Product.find({ stock: { $lte: 5 } })
            .populate('category', 'name')
            .sort('stock');

        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        next(error);
    }
};

// Get recently added products
exports.getRecentProducts = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const products = await Product.find()
            .populate('category', 'name')
            .sort('-createdAt')
            .limit(limit);

        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        next(error);
    }
};

// Update product stock
exports.updateStock = async (req, res, next) => {
    try {
        const { stock } = req.body;
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { stock: parseInt(stock, 10), updatedAt: Date.now() },
            { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.json({
            success: true,
            message: 'Stock updated successfully',
            data: product
        });
    } catch (error) {
        next(error);
    }
};
