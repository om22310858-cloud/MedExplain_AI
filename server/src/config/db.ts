import mongoose from 'mongoose';
import { ENV } from './env.js';
import { logger } from '../utils/logger.js';

mongoose.set('bufferCommands', false);
mongoose.set('strictQuery', true);

let isConnected = false;

export const connectDatabase = async (): Promise<boolean> => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return true;
  }

  try {
    const conn = await mongoose.connect(ENV.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    logger.info(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return true;
  } catch (error) {
    isConnected = false;
    const message = error instanceof Error ? error.message : 'Unknown database error';
    logger.error(
      `MongoDB connection failed (${message}). Set MONGODB_URI in .env to a running local MongoDB or a free MongoDB Atlas cluster. Auth and reports will return HTTP 503 until the database is available.`,
      error
    );
    return false;
  }
};

export const getDbStatus = (): {
  connected: boolean;
  readyState: number;
  host?: string;
  database?: string;
} => {
  const connected = isConnected && mongoose.connection.readyState === 1;
  return {
    connected,
    readyState: mongoose.connection.readyState,
    host: connected ? mongoose.connection.host : undefined,
    database: connected ? mongoose.connection.name : undefined,
  };
};

export const disconnectDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('MongoDB disconnected cleanly');
  }
};
