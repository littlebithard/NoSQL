const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['order', 'product', 'promotion', 'announcement', 'review', 'stock', 'info'],
        default: 'info'
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    link: {
        type: String  // URL to navigate to when notification is clicked
    },
    read: {
        type: Boolean,
        default: false,
        index: true
    },
    readAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
});

// Compound index for efficient queries
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

// Auto-delete old read notifications after 30 days
notificationSchema.index({ readAt: 1 }, {
    expireAfterSeconds: 30 * 24 * 60 * 60,  // 30 days
    partialFilterExpression: { read: true }
});

module.exports = mongoose.model('Notification', notificationSchema);