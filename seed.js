require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Models
const User = require('./models/user');
const Category = require('./models/category');
const Product = require('./models/product');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected successfully');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
};

const categories = [
    { name: 'Living Room', description: 'Sofas, armchairs, coffee tables and more' },
    { name: 'Bedroom', description: 'Beds, nightstands, dressers and wardrobes'},
    { name: 'Dining', description: 'Dining tables, chairs and bar furniture'},
    { name: 'Office', description: 'Desks, office chairs and storage solutions'},
    { name: 'Outdoor', description: 'Patio sets, garden furniture and loungers'},
    { name: 'Storage', description: 'Shelving, cabinets and organization'}
];

const products = [
    // Living Room
    {
        sku: 'LR-SOFA-001',
        name: 'Milano Modern Sectional Sofa',
        brand: 'ComfortLux',
        price: 1299.99,
        discountPrice: 999.99,
        description: 'A stunning L-shaped sectional sofa featuring premium fabric upholstery, high-density foam cushions, and solid wood legs. Perfect for modern living rooms.',
        stock: 15,
        material: 'Premium Fabric',
        color: 'Charcoal Gray',
        dimensions: { width: 112, height: 34, depth: 65, weight: 180 },
        features: ['Reversible Chaise', 'Removable Cushions', 'Solid Wood Frame', 'Stain Resistant'],
        isFeatured: true,
        categoryName: 'Living Room'
    },
    {
        sku: 'LR-ARM-002',
        name: 'Scandinavian Accent Chair',
        brand: 'Nordic Home',
        price: 449.99,
        description: 'Elegant mid-century modern accent chair with velvet upholstery and gold-finished metal legs.',
        stock: 25,
        material: 'Velvet',
        color: 'Forest Green',
        dimensions: { width: 28, height: 32, depth: 30, weight: 35 },
        features: ['Velvet Upholstery', 'Gold Metal Legs', 'Ergonomic Design'],
        isFeatured: true,
        categoryName: 'Living Room'
    },
    {
        sku: 'LR-TABLE-003',
        name: 'Marble Top Coffee Table',
        brand: 'Artisan Craft',
        price: 599.99,
        description: 'Luxurious coffee table featuring genuine marble top and brushed brass base.',
        stock: 12,
        material: 'Marble & Brass',
        color: 'White Marble',
        dimensions: { width: 48, height: 18, depth: 24, weight: 85 },
        features: ['Genuine Marble', 'Brushed Brass Base', 'Scratch Resistant'],
        isFeatured: true,
        categoryName: 'Living Room'
    },
    {
        sku: 'LR-SHELF-004',
        name: 'Industrial Bookshelf',
        brand: 'Urban Modern',
        price: 349.99,
        description: 'Five-tier industrial bookshelf with reclaimed wood shelves and black metal frame.',
        stock: 20,
        material: 'Reclaimed Wood & Metal',
        color: 'Natural/Black',
        dimensions: { width: 36, height: 72, depth: 12, weight: 65 },
        features: ['5 Shelves', 'Wall Anchor Kit', 'Easy Assembly'],
        categoryName: 'Living Room'
    },

    // Bedroom
    {
        sku: 'BR-BED-001',
        name: 'Elena Platform Bed Frame',
        brand: 'DreamRest',
        price: 899.99,
        discountPrice: 749.99,
        description: 'Modern platform bed with upholstered headboard, solid wood slats, and hidden storage.',
        stock: 18,
        material: 'Solid Wood & Linen',
        color: 'Light Gray',
        dimensions: { width: 82, height: 48, depth: 86, weight: 120 },
        features: ['Queen Size', 'Upholstered Headboard', 'Under-bed Storage', 'No Box Spring Needed'],
        isFeatured: true,
        categoryName: 'Bedroom'
    },
    {
        sku: 'BR-NST-002',
        name: 'Walnut Nightstand',
        brand: 'Artisan Craft',
        price: 249.99,
        description: 'Elegant walnut nightstand with two drawers and brass hardware.',
        stock: 30,
        material: 'Solid Walnut',
        color: 'Dark Walnut',
        dimensions: { width: 22, height: 24, depth: 16, weight: 35 },
        features: ['Soft-Close Drawers', 'Brass Hardware', 'Cord Management'],
        categoryName: 'Bedroom'
    },
    {
        sku: 'BR-DRESS-003',
        name: 'Modern 6-Drawer Dresser',
        brand: 'Nordic Home',
        price: 799.99,
        description: 'Spacious dresser with clean lines, soft-close drawers, and anti-tip hardware.',
        stock: 10,
        material: 'Engineered Wood',
        color: 'Oak White',
        dimensions: { width: 60, height: 34, depth: 18, weight: 150 },
        features: ['6 Spacious Drawers', 'Soft-Close', 'Anti-Tip Kit Included'],
        categoryName: 'Bedroom'
    },

    // Dining
    {
        sku: 'DN-TABLE-001',
        name: 'Farmhouse Dining Table',
        brand: 'Rustic Living',
        price: 1199.99,
        description: 'Solid oak farmhouse table that seats 8, featuring handcrafted details and trestle base.',
        stock: 8,
        material: 'Solid Oak',
        color: 'Natural Oak',
        dimensions: { width: 84, height: 30, depth: 42, weight: 200 },
        features: ['Seats 8', 'Handcrafted', 'Extendable Leaf'],
        isFeatured: true,
        categoryName: 'Dining'
    },
    {
        sku: 'DN-CHAIR-002',
        name: 'Windsor Dining Chair (Set of 2)',
        brand: 'Rustic Living',
        price: 299.99,
        description: 'Classic Windsor-style dining chairs with spindle back and contoured seat.',
        stock: 40,
        material: 'Solid Beech',
        color: 'Black',
        dimensions: { width: 18, height: 37, depth: 20, weight: 25 },
        features: ['Set of 2', 'Contoured Seat', 'Classic Design'],
        categoryName: 'Dining'
    },
    {
        sku: 'DN-BAR-003',
        name: 'Industrial Bar Stool (Set of 2)',
        brand: 'Urban Modern',
        price: 249.99,
        description: 'Counter-height bar stools with swivel seats and adjustable footrest.',
        stock: 35,
        material: 'Metal & Leather',
        color: 'Black/Brown',
        dimensions: { width: 16, height: 26, depth: 16, weight: 20 },
        features: ['Set of 2', '360° Swivel', 'Adjustable Height'],
        categoryName: 'Dining'
    },

    // Office
    {
        sku: 'OF-DESK-001',
        name: 'Executive Standing Desk',
        brand: 'WorkSpace Pro',
        price: 899.99,
        discountPrice: 749.99,
        description: 'Electric height-adjustable desk with memory presets and cable management.',
        stock: 15,
        material: 'Bamboo & Steel',
        color: 'Natural Bamboo',
        dimensions: { width: 60, height: 48, depth: 30, weight: 100 },
        features: ['Electric Adjustment', '4 Memory Presets', 'Cable Management', 'Anti-Collision'],
        isFeatured: true,
        categoryName: 'Office'
    },
    {
        sku: 'OF-CHAIR-002',
        name: 'Ergonomic Mesh Office Chair',
        brand: 'WorkSpace Pro',
        price: 549.99,
        description: 'High-back ergonomic chair with lumbar support, adjustable armrests, and breathable mesh.',
        stock: 22,
        material: 'Mesh & Aluminum',
        color: 'Black',
        dimensions: { width: 27, height: 46, depth: 27, weight: 45 },
        features: ['Lumbar Support', 'Adjustable Armrests', 'Tilt Lock', 'Headrest'],
        categoryName: 'Office'
    },

    // Outdoor
    {
        sku: 'OD-SET-001',
        name: 'Patio Conversation Set (4-Piece)',
        brand: 'Outdoor Living',
        price: 1499.99,
        discountPrice: 1199.99,
        description: 'Weather-resistant wicker patio set with cushions, including sofa, 2 chairs, and coffee table.',
        stock: 6,
        material: 'All-Weather Wicker',
        color: 'Brown/Beige',
        dimensions: { width: 80, height: 32, depth: 30, weight: 150 },
        features: ['4 Pieces', 'UV Resistant', 'Waterproof Cushions', 'Rust-Proof Frame'],
        isFeatured: true,
        categoryName: 'Outdoor'
    },
    {
        sku: 'OD-LOUNGE-002',
        name: 'Teak Chaise Lounge',
        brand: 'Outdoor Living',
        price: 699.99,
        description: 'Premium teak wood chaise lounge with adjustable backrest and wheels.',
        stock: 10,
        material: 'Teak Wood',
        color: 'Natural Teak',
        dimensions: { width: 26, height: 35, depth: 78, weight: 55 },
        features: ['Adjustable Back', 'Wheels', 'Weather Resistant'],
        categoryName: 'Outdoor'
    },

    // Storage
    {
        sku: 'ST-CAB-001',
        name: 'Modern Storage Cabinet',
        brand: 'Nordic Home',
        price: 449.99,
        description: 'Minimalist storage cabinet with adjustable shelves and soft-close doors.',
        stock: 14,
        material: 'Engineered Wood',
        color: 'White',
        dimensions: { width: 32, height: 48, depth: 14, weight: 80 },
        features: ['Adjustable Shelves', 'Soft-Close Doors', 'Wall Mount Option'],
        categoryName: 'Storage'
    },
    {
        sku: 'ST-CUBE-002',
        name: 'Modular Storage Cubes (Set of 4)',
        brand: 'Urban Modern',
        price: 199.99,
        description: 'Stackable and configurable storage cubes for versatile organization.',
        stock: 50,
        material: 'Engineered Wood',
        color: 'Oak',
        dimensions: { width: 15, height: 15, depth: 15, weight: 30 },
        features: ['Set of 4', 'Stackable', 'Multiple Configurations'],
        categoryName: 'Storage'
    }
];

const users = [
    {
        username: 'admin',
        email: 'admin@furniturehub.com',
        password: 'admin123',
        role: 'admin',
        profile: {
            firstName: 'Admin',
            lastName: 'User'
        }
    },
    {
        username: 'staff',
        email: 'staff@furniturehub.com',
        password: 'staff123',
        role: 'staff',
        profile: {
            firstName: 'Staff',
            lastName: 'Member'
        }
    },
    {
        username: 'customer1',
        email: 'customer@example.com',
        password: 'customer123',
        role: 'customer',
        profile: {
            firstName: 'John',
            lastName: 'Doe',
            address: {
                street: '123 Main St',
                city: 'New York',
                state: 'NY',
                zip: '10001'
            }
        }
    }
];

const seedDatabase = async () => {
    try {
        await connectDB();

        // Clear existing data
        console.log('Clearing existing data...');
        await User.deleteMany({});
        await Category.deleteMany({});
        await Product.deleteMany({});

        // Create categories
        console.log('Creating categories...');
        const createdCategories = await Category.insertMany(categories);
        console.log(`Created ${createdCategories.length} categories`);

        // Create category map for product references
        const categoryMap = {};
        createdCategories.forEach(cat => {
            categoryMap[cat.name] = cat._id;
        });

        // Create products with category references
        console.log('Creating products...');
        const productsWithCategories = products.map(product => ({
            ...product,
            category: categoryMap[product.categoryName]
        }));

        // Remove categoryName field
        productsWithCategories.forEach(p => delete p.categoryName);

        const createdProducts = await Product.insertMany(productsWithCategories);
        console.log(`Created ${createdProducts.length} products`);

        // Update category product counts
        for (const category of createdCategories) {
            const count = await Product.countDocuments({ category: category._id });
            await Category.findByIdAndUpdate(category._id, { productCount: count });
        }

        // Create users
        console.log('Creating users...');
        for (const userData of users) {
            const user = new User(userData);
            await user.save();
        }
        console.log(`Created ${users.length} users`);

        console.log('\n Database seeded successfully!');
        console.log('\n Test Accounts:');
        console.log('   Admin: admin@furniturehub.com / admin123');
        console.log('   Staff: staff@furniturehub.com / staff123');
        console.log('   Customer: customer@example.com / customer123');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();