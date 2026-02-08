const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

const Notification = require('../models/notification');

router.get('/', protect, async (req, res, next) => {
    try {
        const { unreadOnly, page = 1, limit = 20 } = req.query;

        const query = { user: req.user.id };
        if (unreadOnly === 'true') {
            query.read = false;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [notifications, total, unreadCount] = await Promise.all([
            Notification.find(query)
                .sort('-createdAt')
                .skip(skip)
                .limit(parseInt(limit)),
            Notification.countDocuments(query),
            Notification.countDocuments({ user: req.user.id, read: false })
        ]);

        res.json({
            success: true,
            count: notifications.length,
            unreadCount,
            data: notifications,
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
});

router.get('/unread-count', protect, async (req, res, next) => {
    try {
        const count = await Notification.countDocuments({
            user: req.user.id,
            read: false
        });

        res.json({
            success: true,
            data: { count }
        });
    } catch (error) {
        next(error);
    }
});

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
            message: 'Notification marked as read',
            data: notification
        });
    } catch (error) {
        next(error);
    }
});

router.put('/read-all', protect, async (req, res, next) => {
    try {
        const result = await Notification.updateMany(
            { user: req.user.id, read: false },
            { read: true, readAt: Date.now() }
        );

        res.json({
            success: true,
            message: 'All notifications marked as read',
            data: { modifiedCount: result.modifiedCount }
        });
    } catch (error) {
        next(error);
    }
});

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

router.delete('/', protect, async (req, res, next) => {
    try {
        const result = await Notification.deleteMany({
            user: req.user.id,
            read: true
        });

        res.json({
            success: true,
            message: 'Read notifications deleted',
            data: { deletedCount: result.deletedCount }
        });
    } catch (error) {
        next(error);
    }
});

router.post('/send', protect, authorize('admin'), async (req, res, next) => {
    try {
        const { userId, userIds, type, title, message, link } = req.body;

        if (!title || !message) {
            return res.status(400).json({
                success: false,
                message: 'Title and message are required'
            });
        }

        let recipients = [];

        if (userId) {
            recipients = [userId];
        } else if (userIds && Array.isArray(userIds)) {
            recipients = userIds;
        } else {
            return res.status(400).json({
                success: false,
                message: 'Please specify userId or userIds'
            });
        }

        const notifications = recipients.map(user => ({
            user,
            type: type || 'info',
            title,
            message,
            link
        }));

        const createdNotifications = await Notification.insertMany(notifications);

        res.status(201).json({
            success: true,
            message: `Notification sent to ${createdNotifications.length} user(s)`,
            data: { count: createdNotifications.length }
        });
    } catch (error) {
        next(error);
    }
});

router.post('/broadcast', protect, authorize('admin'), async (req, res, next) => {
    try {
        const User = require('../models/user');
        const { type, title, message, link, role } = req.body;

        if (!title || !message) {
            return res.status(400).json({
                success: false,
                message: 'Title and message are required'
            });
        }

        // Get users based on role filter
        const query = role ? { role } : {};
        const users = await User.find(query).select('_id');

        const notifications = users.map(user => ({
            user: user._id,
            type: type || 'announcement',
            title,
            message,
            link
        }));

        const createdNotifications = await Notification.insertMany(notifications);

        res.status(201).json({
            success: true,
            message: `Broadcast sent to ${createdNotifications.length} user(s)`,
            data: { count: createdNotifications.length }
        });
    } catch (error) {
        next(error);
    }
});

router.get('/stats', protect, authorize('admin', 'staff'), async (req, res, next) => {
    try {
        const stats = await Notification.aggregate([
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 },
                    unreadCount: {
                        $sum: { $cond: [{ $eq: ['$read', false] }, 1, 0] }
                    }
                }
            }
        ]);

        const totalNotifications = await Notification.countDocuments();
        const totalUnread = await Notification.countDocuments({ read: false });

        res.json({
            success: true,
            data: {
                total: totalNotifications,
                totalUnread,
                byType: stats
            }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;