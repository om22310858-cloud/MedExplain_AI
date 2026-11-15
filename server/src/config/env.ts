import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(currentDir, '../..');
const workspaceRoot = path.resolve(serverRoot, '..');

// Load workspace .env first, then server/.env, then process cwd (later files do not override existing keys)
dotenv.config({ path: path.join(workspaceRoot, '.env') });
dotenv.config({ path: path.join(serverRoot, '.env') });
dotenv.config();

const DEFAULT_DEV_JWT_SECRET = 'dev_insecure_jwt_secret_change_in_production_key_32chars';

export const ENV = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/medexplain_ai',
  JWT_SECRET: process.env.JWT_SECRET || DEFAULT_DEV_JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  AI_PROVIDER: process.env.AI_PROVIDER || 'auto', // 'llama' | 'gemini' | 'auto'
  OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434',
  OLLAMA_MODEL: process.env.OLLAMA_MODEL || 'llama3.2:latest',
  STORAGE_PROVIDER: (process.env.STORAGE_PROVIDER || 'local') as 'local' | 'supabase',
  UPLOAD_DIR: path.resolve(process.env.UPLOAD_DIR || path.join(serverRoot, 'uploads')),
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: process.env.SMTP_PORT || '',
  SMTP_USER: process.env.SMTP_USER || '',
  EMAIL_FROM: process.env.EMAIL_FROM || '',
};

export const isEmailConfigured = (): boolean => {
  return Boolean(ENV.SMTP_HOST && ENV.SMTP_USER);
};

export const assertProductionSecrets = (): void => {
  if (!ENV.IS_PRODUCTION) {
    return;
  }
  if (!process.env.JWT_SECRET || ENV.JWT_SECRET === DEFAULT_DEV_JWT_SECRET || ENV.JWT_SECRET.length < 32) {
    throw new Error(
      'JWT_SECRET must be set to a strong unique value (32+ characters) before running in production.'
    );
  }
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI must be set in production.');
  }
};

export const setMongoUri = (uri: string): void => {
  ENV.MONGODB_URI = uri;
};
