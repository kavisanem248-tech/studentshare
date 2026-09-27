import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { config } from './config/index.js';
import { initDb, client } from './db/index.js';
import { seed } from './db/seed.js';
import { errorHandler } from './middleware/errorHandler.js';

// Route modules
import authRouter from './routes/auth.js';
import materialsRouter from './routes/materials.js';
import circlesRouter from './routes/circles.js';
import usersRouter from './routes/users.js';
import notificationsRouter from './routes/notifications.js';
import adminRouter from './routes/admin.js';

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS configuration
app.use(cors({
  origin: true, // Allow frontend dev and preview servers
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health Check API Endpoint (Required by Section 30 STEP 7)
app.get('/api/health', async (req, res) => {
  try {
    const dbTest = await client.execute('SELECT 1 as healthy');
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'StudentShare API',
      database: dbTest.rows.length > 0 ? 'connected' : 'degraded',
      environment: config.nodeEnv,
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      message: 'Database connectivity issue',
      error: err.message,
    });
  }
});

// Mount API routes
app.use('/api/auth', authRouter);
app.use('/api/materials', materialsRouter);
app.use('/api/circles', circlesRouter);
app.use('/api/users', usersRouter);
app.use('/api/user', usersRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/admin', adminRouter);

// Centralized error handling
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    console.log('[Server] Connecting to database...');
    await initDb();
    console.log('[Server] Checking and seeding default academic data...');
    await seed();

    app.listen(config.port, '0.0.0.0', () => {
      console.log(`[StudentShare Server] Backend running at http://localhost:${config.port}`);
      console.log(`[StudentShare Server] API Health check available at http://localhost:${config.port}/api/health`);
    });
  } catch (err) {
    console.error('[Server] Critical failure during server boot:', err);
    process.exit(1);
  }
}

startServer();
