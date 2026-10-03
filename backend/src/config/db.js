import mongoose from 'mongoose';

/**
 * Establishes connection to MongoDB database
 */
export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/insuredmine_db';

    mongoose.connection.on('connected', () => {
      console.log('✅ MongoDB connected successfully');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });

    await mongoose.connect(mongoUri);
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    // Don't exit immediately in dev if DB is starting up, but rethrow for server bootstrap
    throw error;
  }
};

export default connectDB;
