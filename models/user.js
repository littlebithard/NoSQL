const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        enum: ['admin', 'staff', 'customer'],
        default: 'customer'
    },
    profile: {
        firstName: String,
        lastName: String,
        phone: String,
        address: {
            street: String,
            city: String,
            state: String,
            zip: String,
            country: { type: String, default: 'USA' }
        }
    },
    cart: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        quantity: {
            type: Number,
            default: 1,
            min: 1
        }
    }],
    wishlist: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    orderHistory: [{
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order'
        },
        orderedAt: Date,
        totalAmount: Number
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Get cart total
userSchema.methods.getCartTotal = async function () {
    await this.populate('cart.product');
    return this.cart.reduce((sum, item) => {
        const price = item.product.discountPrice || item.product.price;
        return sum + (price * item.quantity);
    }, 0);
};

module.exports = mongoose.model('User', userSchema);