import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config();

const required = ['DATABASE_URL', 'API_KEY'];

required.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable ${key}`);
  }
});

const resolveUploadsDir = () => {
  const configured = process.env.UPLOADS_DIR;
  if (configured) {
    return path.isAbsolute(configured)
      ? configured
      : path.resolve(process.cwd(), configured);
  }
  return path.resolve(process.cwd(), 'uploads');
};

const normalizeBaseUrl = (value) => {
  if (!value) return '';
  return value.endsWith('/') ? value.slice(0, -1) : value;
};

export const env = {
  databaseUrl: process.env.DATABASE_URL,
  apiKey: process.env.API_KEY,
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  host: process.env.HOST || '0.0.0.0',
  enableCors: process.env.ENABLE_CORS !== '0',
  uploadsDir: resolveUploadsDir(),
  uploadsBasePath: process.env.UPLOADS_BASE_PATH || '/uploads',
  uploadsPublicBaseUrl: normalizeBaseUrl(process.env.UPLOADS_PUBLIC_BASE_URL || ''),
  uploadMaxBytes: Number(process.env.UPLOAD_MAX_BYTES || 50 * 1024 * 1024),
};
