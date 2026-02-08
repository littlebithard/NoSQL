const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect, authorize } = require('../middleware/auth');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Accept images only
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 25 * 1024 * 1024 // 25MB limit
    },
    fileFilter: fileFilter
});

router.post('/image', protect, authorize('admin', 'staff'), upload.single('image'), async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const imageUrl = `/uploads/${req.file.filename}`;

        res.json({
            success: true,
            message: 'Image uploaded successfully',
            data: {
                filename: req.file.filename,
                url: imageUrl,
                size: req.file.size
            }
        });
    } catch (error) {
        next(error);
    }
});

router.post('/images', protect, authorize('admin', 'staff'), upload.array('images', 10), async (req, res, next) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files uploaded'
            });
        }

        const images = req.files.map(file => ({
            filename: file.filename,
            url: `/uploads/${file.filename}`,
            size: file.size
        }));

        res.json({
            success: true,
            message: `${images.length} image(s) uploaded successfully`,
            data: images
        });
    } catch (error) {
        next(error);
    }
});

router.post('/product-images/:productId', protect, authorize('admin', 'staff'), upload.array('images', 5), async (req, res, next) => {
    try {
        const Product = require('../models/product');

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files uploaded'
            });
        }

        const product = await Product.findById(req.params.productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const imageUrls = req.files.map(file => `/uploads/${file.filename}`);

        // Add new images to product
        product.images = [...product.images, ...imageUrls];
        await product.save();

        res.json({
            success: true,
            message: 'Product images uploaded successfully',
            data: {
                productId: product._id,
                images: imageUrls,
                totalImages: product.images.length
            }
        });
    } catch (error) {
        next(error);
    }
});

router.delete('/image/:filename', protect, authorize('admin', 'staff'), async (req, res, next) => {
    try {
        const fs = require('fs');
        const filePath = path.join(__dirname, '../../uploads', req.params.filename);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        // Delete file
        fs.unlinkSync(filePath);

        res.json({
            success: true,
            message: 'Image deleted successfully'
        });
    } catch (error) {
        next(error);
    }
});

router.post('/avatar', protect, upload.single('avatar'), async (req, res, next) => {
    try {
        const User = require('../models/user');

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const avatarUrl = `/uploads/${req.file.filename}`;

        // Update user profile
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { 'profile.avatar': avatarUrl },
            { new: true }
        ).select('-password');

        res.json({
            success: true,
            message: 'Avatar uploaded successfully',
            data: {
                avatar: avatarUrl,
                user: user
            }
        });
    } catch (error) {
        next(error);
    }
});

router.post('/category-image/:categoryId', protect, authorize('admin', 'staff'), upload.single('image'), async (req, res, next) => {
    try {
        const Category = require('../models/category');

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const category = await Category.findById(req.params.categoryId);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        const imageUrl = `/uploads/${req.file.filename}`;
        category.image = imageUrl;
        await category.save();

        res.json({
            success: true,
            message: 'Category image uploaded successfully',
            data: {
                categoryId: category._id,
                image: imageUrl
            }
        });
    } catch (error) {
        next(error);
    }
});

router.get('/images', protect, authorize('admin', 'staff'), async (req, res, next) => {
    try {
        const fs = require('fs');
        const uploadsDir = path.join(__dirname, '../../uploads');

        if (!fs.existsSync(uploadsDir)) {
            return res.json({
                success: true,
                data: []
            });
        }

        const files = fs.readdirSync(uploadsDir);
        const images = files
            .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
            .map(file => {
                const stats = fs.statSync(path.join(uploadsDir, file));
                return {
                    filename: file,
                    url: `/uploads/${file}`,
                    size: stats.size,
                    uploadedAt: stats.birthtime
                };
            })
            .sort((a, b) => b.uploadedAt - a.uploadedAt);

        res.json({
            success: true,
            count: images.length,
            data: images
        });
    } catch (error) {
        next(error);
    }
});

// Error handling for multer
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File size too large. Maximum size is 5MB'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Too many files. Maximum is 10 files'
            });
        }
    }
    next(error);
});

module.exports = router;