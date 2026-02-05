const express = require('express');
const router = express.Router();
const Category = require('../models/category');
const { protect, authorize } = require('../middleware/auth');

router.get('/', async (req, res, next) => {
    try {
        const categories = await Category.find().sort('name');

        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        next(error);
    }
});

router.post('/', protect, authorize('admin', 'staff'), async (req, res, next) => {
    try {
        const category = await Category.create(req.body);

        res.status(201).json({
            success: true,
            data: category
        });
    } catch (error) {
        next(error);
    }
});

router.put('/:id', protect, authorize('admin', 'staff'), async (req, res, next) => {
    try {
        const category = await Category.findByIdAndUpdate(
            req.params.id,
            req.body,
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
            data: category
        });
    } catch (error) {
        next(error);
    }
});

router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.json({
            success: true,
            message: 'Category deleted'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;