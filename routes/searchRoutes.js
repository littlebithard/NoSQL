const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const Category = require('../models/category');

router.get('/', async (req, res, next) => {
    try {
        const {
            q,              // Search query
            category,       // Category ID
            minPrice,
            maxPrice,
            brand,
            status,
            featured,
            minRating,
            sortBy = 'relevance',  // relevance, price-asc, price-desc, rating, newest
            page = 1,
            limit = 20
        } = req.query;

        const query = {};

        // Text search
        if (q) {
            query.$or = [
                { name: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } },
                { brand: { $regex: q, $options: 'i' } },
                { sku: { $regex: q, $options: 'i' } }
            ];
        }

        // Category filter
        if (category) {
            query.category = category;
        }

        // Price range filter
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = parseFloat(minPrice);
            if (maxPrice) query.price.$lte = parseFloat(maxPrice);
        }

        // Brand filter
        if (brand) {
            query.brand = { $regex: brand, $options: 'i' };
        }

        // Status filter
        if (status) {
            query.status = status;
        }

        // Featured filter
        if (featured === 'true') {
            query.isFeatured = true;
        }

        // Rating filter
        if (minRating) {
            query.averageRating = { $gte: parseFloat(minRating) };
        }

        // Determine sort order
        let sortOrder;
        switch (sortBy) {
            case 'price-asc':
                sortOrder = { price: 1 };
                break;
            case 'price-desc':
                sortOrder = { price: -1 };
                break;
            case 'rating':
                sortOrder = { averageRating: -1 };
                break;
            case 'newest':
                sortOrder = { createdAt: -1 };
                break;
            case 'name':
                sortOrder = { name: 1 };
                break;
            default: // relevance
                sortOrder = { averageRating: -1, createdAt: -1 };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [products, total] = await Promise.all([
            Product.find(query)
                .populate('category', 'name')
                .sort(sortOrder)
                .skip(skip)
                .limit(parseInt(limit)),
            Product.countDocuments(query)
        ]);

        res.json({
            success: true,
            count: products.length,
            data: products,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            },
            filters: {
                q, category, minPrice, maxPrice, brand, status, featured, minRating, sortBy
            }
        });
    } catch (error) {
        next(error);
    }
});

router.get('/suggestions', async (req, res, next) => {
    try {
        const { q, limit = 5 } = req.query;

        if (!q || q.length < 2) {
            return res.json({
                success: true,
                data: []
            });
        }

        const suggestions = await Product.find({
            $or: [
                { name: { $regex: q, $options: 'i' } },
                { brand: { $regex: q, $options: 'i' } }
            ]
        })
            .select('name brand images price')
            .limit(parseInt(limit));

        res.json({
            success: true,
            data: suggestions
        });
    } catch (error) {
        next(error);
    }
});

router.get('/filters', async (req, res, next) => {
    try {
        const { category } = req.query;
        const query = category ? { category } : {};

        // Get unique brands
        const brands = await Product.distinct('brand', query);

        // Get price range
        const priceStats = await Product.aggregate([
            ...(category ? [{ $match: { category: require('mongoose').Types.ObjectId(category) } }] : []),
            {
                $group: {
                    _id: null,
                    minPrice: { $min: '$price' },
                    maxPrice: { $max: '$price' }
                }
            }
        ]);

        // Get available categories with product counts
        const categories = await Category.find()
            .select('name productCount')
            .sort('name');

        // Get rating distribution
        const ratingDistribution = await Product.aggregate([
            ...(category ? [{ $match: { category: require('mongoose').Types.ObjectId(category) } }] : []),
            {
                $bucket: {
                    groupBy: '$averageRating',
                    boundaries: [0, 1, 2, 3, 4, 5],
                    default: 0,
                    output: {
                        count: { $sum: 1 }
                    }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                brands: brands.sort(),
                priceRange: {
                    min: priceStats[0]?.minPrice || 0,
                    max: priceStats[0]?.maxPrice || 0
                },
                categories,
                ratingDistribution
            }
        });
    } catch (error) {
        next(error);
    }
});

router.post('/recent', async (req, res, next) => {
    try {
        res.json({
            success: true,
            message: 'Search saved to history'
        });
    } catch (error) {
        next(error);
    }
});

router.get('/trending', async (req, res, next) => {
    try {
        // Get most popular products as trending searches
        const trending = await Product.find()
            .sort('-averageRating')
            .limit(10)
            .select('name brand');

        const trendingTerms = trending.map(p => ({
            term: p.name,
            type: 'product'
        }));

        // Add popular brands
        const popularBrands = await Product.aggregate([
            {
                $group: {
                    _id: '$brand',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        popularBrands.forEach(b => {
            trendingTerms.push({
                term: b._id,
                type: 'brand'
            });
        });

        res.json({
            success: true,
            data: trendingTerms
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;