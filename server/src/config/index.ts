import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server directory or root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'file:studentshare.db',
  authSecret: process.env.AUTH_SECRET || 'studentshare_super_secure_jwt_secret_key_2026_production_ready',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  storage: {
    endpoint: process.env.STORAGE_ENDPOINT || '',
    accessKey: process.env.STORAGE_ACCESS_KEY || '',
    secretKey: process.env.STORAGE_SECRET_KEY || '',
    bucket: process.env.STORAGE_BUCKET || 'studentshare-materials',
    region: process.env.STORAGE_REGION || 'us-east-1',
  },
  aiApiKey: process.env.AI_API_KEY || '',
  clientUrl: process.env.CLIENT_URL || (process.env.NODE_ENV === 'production' ? 'https://studentshare-1.onrender.com' : 'http://localhost:5173'),
  uploadsDir: path.resolve(__dirname, '../../uploads'),
};
