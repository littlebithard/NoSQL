const express = require('express');
const router = express.Router();
const Category = require('../models/category');
const { protect, authorize } = require('../middleware/auth');

router.get('/', async (req, res, next) => {
    try {
        const categories = await Category.find().sort('name');

        res.json({
            success: true,
            count: categories.length,
            data: categories
        });
    } catch (error) {
        next(error);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.json({
            success: true,
            data: category
        });
    } catch (error) {
        next(error);
    }
});

router.post('/', protect, authorize('admin', 'staff'), async (req, res, next) => {
    try {
        const { name, description, icon, image } = req.body;

        // Check if category already exists
        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: 'Category with this name already exists'
            });
        }

        const category = await Category.create({
            name,
            description,
            icon,
            image
        });

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: category
        });
    } catch (error) {
        next(error);
    }
});

router.put('/:id', protect, authorize('admin', 'staff'), async (req, res, next) => {
    try {
        const { name, description, icon, image } = req.body;

        // Check if new name conflicts with existing category
        if (name) {
            const existingCategory = await Category.findOne({
                name,
                _id: { $ne: req.params.id }
            });

            if (existingCategory) {
                return res.status(400).json({
                    success: false,
                    message: 'Another category with this name already exists'
                });
            }
        }

        const category = await Category.findByIdAndUpdate(
            req.params.id,
            { name, description, icon, image },
            { new: true, runValidators: true }
        );

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.json({
            success: true,
            message: 'Category updated successfully',
            data: category
        });
    } catch (error) {
        next(error);
    }
});

router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        // Check if category has products
        if (category.productCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete category with ${category.productCount} products. Please reassign or delete products first.`
            });
        }

        await Category.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        next(error);
    }
});

router.get('/:id/products', async (req, res, next) => {
    try {
        const Product = require('../models/product');

        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        const products = await Product.find({ category: req.params.id })
            .populate('category', 'name')
            .sort('-createdAt');

        res.json({
            success: true,
            category: category.name,
            count: products.length,
            data: products
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;