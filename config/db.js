const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Ensure indexes exist for frequently queried collections
        await createIndexes();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const createIndexes = async () => {
    try {
        // Use correct relative paths and model names
        const Book = require('../models/book');
        const User = require('../models/user');
        const Borrowing = require('../models/borrowing');

        if (Book.createIndexes) await Book.createIndexes();
        if (User.createIndexes) await User.createIndexes();
        if (Borrowing.createIndexes) await Borrowing.createIndexes();

        console.log('Database indexes created successfully');
    } catch (error) {
        console.error('Error creating indexes:', error);
    }
};

module.exports = connectDB;