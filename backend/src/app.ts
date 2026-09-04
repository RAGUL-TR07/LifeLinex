import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import config from './config';
import logger from './utils/logger';
import { errorHandler, notFound } from './middlewares/error.middleware';
import passport, { initPassport } from './config/passport';

// Routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import emergencyRoutes from './routes/emergency.routes';
import bloodRoutes from './routes/blood.routes';
import campaignRoutes from './routes/campaign.routes';
import hospitalRoutes from './routes/hospital.routes';
import ambulanceRoutes from './routes/ambulance.routes';
import notificationRoutes from './routes/notification.routes';
import chatRoutes from './routes/chat.routes';
import paymentRoutes from './routes/payment.routes';
import adminRoutes from './routes/admin.routes';
import medicalRecordRoutes from './routes/medicalRecord.routes';
import governmentSchemeRoutes from './routes/governmentScheme.routes';
import medicineRoutes from './routes/medicine.routes';
import equipmentRoutes from './routes/equipment.routes';
import volunteerRoutes from './routes/volunteer.routes';
import analyticsRoutes from './routes/analytics.routes';

const createApp = (): Application => {
  const app = express();

  // ─── Passport ─────────────────────────────────────────────────────────────
  initPassport();
  app.use(passport.initialize());

  // ─── Security ─────────────────────────────────────────────────────────────
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (curl, Postman, mobile apps)
        if (!origin) return callback(null, true);
        // Allow any localhost port (covers Vite on 5173, 5174, 5175, etc.)
        if (/^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true);
        // Allow the configured frontend URL
        if (origin === config.frontendUrl) return callback(null, true);
        callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // ─── Rate Limiting ─────────────────────────────────────────────────────────
  // Skip rate limiting in development to avoid "Too many requests" during local dev
  const isDev = config.env === 'development' || config.env === 'test';

  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: isDev ? 0 : config.rateLimit.max, // 0 = unlimited in dev
    skip: () => isDev, // skip middleware entirely in dev
    message: {
      success: false,
      message: 'Too many requests. Please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Auth rate limit — generous enough for normal login flows
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDev ? 0 : 200,     // unlimited in dev; 200 in production
    skip: () => isDev,         // skip entirely in dev
    message: { success: false, message: 'Too many auth attempts. Try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use(limiter);

  // ─── Body Parsing ─────────────────────────────────────────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ─── Logging ──────────────────────────────────────────────────────────────
  if (config.env !== 'test') {
    app.use(
      morgan('combined', {
        stream: { write: (message: string) => logger.info(message.trim()) },
      })
    );
  }

  // ─── Swagger ──────────────────────────────────────────────────────────────
  const swaggerOptions: swaggerJsdoc.Options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'LifeBridge API',
        version: '1.0.0',
        description:
          'LifeBridge – AI-Powered Real-Time Emergency Healthcare, Blood Donation, Medical Crowdfunding, Hospital Resource Management and Community Support Ecosystem API',
        contact: { name: 'LifeBridge Team', email: 'api@lifebridge.com' },
      },
      servers: [{ url: `http://localhost:${config.port}${config.apiPrefix}` }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
    apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
  };

  const swaggerSpec = swaggerJsdoc(swaggerOptions);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // ─── Health Check ─────────────────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    const mongoose = require('mongoose');
    const dbStatus = mongoose.connection.readyState;
    const dbStatusText = ['disconnected', 'connected', 'connecting', 'disconnecting'][dbStatus] || 'unknown';
    res.json({
      success: true,
      message: 'LifelineX API is running',
      timestamp: new Date().toISOString(),
      env: config.env,
      database: {
        status: dbStatusText,
        connected: dbStatus === 1,
      },
    });
  });

  // ─── API Routes ───────────────────────────────────────────────────────────
  const prefix = config.apiPrefix;

  app.use(`${prefix}/auth`, authLimiter, authRoutes);
  app.use(`${prefix}/users`, userRoutes);
  app.use(`${prefix}/emergencies`, emergencyRoutes);
  app.use(`${prefix}/blood`, bloodRoutes);
  app.use(`${prefix}/campaigns`, campaignRoutes);
  app.use(`${prefix}/hospitals`, hospitalRoutes);
  app.use(`${prefix}/ambulances`, ambulanceRoutes);
  app.use(`${prefix}/notifications`, notificationRoutes);
  app.use(`${prefix}/chat`, chatRoutes);
  app.use(`${prefix}/payments`, paymentRoutes);
  app.use(`${prefix}/admin`, adminRoutes);
  app.use(`${prefix}/medical-records`, medicalRecordRoutes);
  app.use(`${prefix}/government-schemes`, governmentSchemeRoutes);
  app.use(`${prefix}/medicines`, medicineRoutes);
  app.use(`${prefix}/equipment`, equipmentRoutes);
  app.use(`${prefix}/volunteers`, volunteerRoutes);
  app.use(`${prefix}/analytics`, analyticsRoutes);

  // ─── Error Handling ───────────────────────────────────────────────────────
  app.use(notFound);
  app.use(errorHandler);

  return app;
};

export default createApp;
