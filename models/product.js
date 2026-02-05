const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    sku: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true,
        index: true
    },
    brand: {
        type: String,
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    discountPrice: {
        type: Number,
        min: 0
    },
    description: String,
    images: [{
        type: String
    }],
    dimensions: {
        width: Number,
        height: Number,
        depth: Number,
        weight: Number
    },
    material: String,
    color: String,
    stock: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    features: [String],
    ratings: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        review: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    averageRating: {
        type: Number,
        default: 0
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['in_stock', 'low_stock', 'out_of_stock'],
        default: 'in_stock'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index for searching
productSchema.index({ name: 1, brand: 1 });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ price: 1 });

// Update status based on stock
productSchema.pre('save', function (next) {
    if (this.stock === 0) {
        this.status = 'out_of_stock';
    } else if (this.stock <= 5) {
        this.status = 'low_stock';
    } else {
        this.status = 'in_stock';
    }
    this.updatedAt = Date.now();
    next();
});

// Calculate average rating
productSchema.methods.updateAverageRating = function() {
    if (this.ratings.length > 0) {
        const sum = this.ratings.reduce((acc, r) => acc + r.rating, 0);
        this.averageRating = sum / this.ratings.length;
    } else {
        this.averageRating = 0;
    }
};

module.exports = mongoose.model('Product', productSchema);
