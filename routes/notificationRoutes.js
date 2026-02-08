const express = require('express');
const router = express.Router();
const Notification = require('../models/notification');
const { protect } = require('../middleware/auth');

// Get all notifications for the logged-in user
router.get('/', protect, async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const startIndex = (page - 1) * limit;

        const notifications = await Notification.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .skip(startIndex)
            .limit(limit);

        const total = await Notification.countDocuments({ user: req.user.id });
        const unreadCount = await Notification.countDocuments({
            user: req.user.id,
            read: false
        });

        res.json({
            success: true,
            count: notifications.length,
            pagination: {
                current: page,
                total: Math.ceil(total / limit),
                totalRecords: total
            },
            unreadCount,
            data: notifications
        });
    } catch (error) {
        next(error);
    }
});

// Mark a notification as read
router.put('/:id/read', protect, async (req, res, next) => {
    try {
        const notification = await Notification.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        notification.read = true;
        notification.readAt = Date.now();
        await notification.save();

        res.json({
            success: true,
            data: notification
        });
    } catch (error) {
        next(error);
    }
});

// Mark all as read
router.put('/read-all', protect, async (req, res, next) => {
    try {
        await Notification.updateMany(
            { user: req.user.id, read: false },
            {
                read: true,
                readAt: Date.now()
            }
        );

        res.json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        next(error);
    }
});

// Delete a notification
router.delete('/:id', protect, async (req, res, next) => {
    try {
        const notification = await Notification.findOneAndDelete({
            _id: req.params.id,
            user: req.user.id
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.json({
            success: true,
            message: 'Notification deleted'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
