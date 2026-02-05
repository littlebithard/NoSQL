const express = require('express');
const router = express.Router();
const User = require('../models/user');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('admin', 'librarian'), async (req, res, next) => {
    try {
        const { role, status, page = 1, limit = 10 } = req.query;

        const query = {};
        if (role) query.role = role;
        if (status) query['membershipDetails.status'] = status;

        const users = await User.find(query)
            .select('-password')
            .sort('-createdAt')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await User.countDocuments(query);

        res.json({
            success: true,
            data: users,
            pagination: {
                total: count,
                page: parseInt(page),
                pages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        next(error);
    }
});

router.get('/:id', protect, async (req, res, next) => {
    try {
        if (req.params.id !== req.user.id && !['admin', 'librarian'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this profile'
            });
        }

        const user = await User.findById(req.params.id)
            .select('-password')
            .populate('borrowingHistory.book', 'title isbn');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
});

router.put('/:id', protect, async (req, res, next) => {
    try {
        if (req.params.id !== req.user.id && !['admin', 'librarian'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this profile'
            });
        }

        const { profile, role, membershipDetails } = req.body;
        const updateData = {};

        if (profile) updateData.profile = profile;

        // Only admins can update role and membership details
        if (['admin', 'librarian'].includes(req.user.role)) {
            if (role) updateData.role = role;
            if (membershipDetails) updateData.membershipDetails = membershipDetails;
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
});

router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;