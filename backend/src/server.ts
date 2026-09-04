import http from 'http';
import createApp from './app'; // Trigger restart comment
import database from './database/connection';
import { initializeSocket } from './socket/socket';
import logger from './utils/logger';
import config from './config';
import { startJobs } from './jobs';

const startServer = async (): Promise<void> => {
  try {
    // Create Express app
    const app = createApp();

    // Create HTTP server
    const httpServer = http.createServer(app);

    // Initialize Socket.io
    initializeSocket(httpServer);

    // Start cron jobs
    startJobs();

    // Handle server startup errors (e.g. port already in use)
    httpServer.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        logger.error(`⚠️ Port ${config.port} is already in use by an active LifelineX Backend process.`);
        logger.info(`💡 Tip: The existing server instance is already running and ready to handle requests on http://localhost:${config.port}`);
      } else {
        logger.error(`Server Error: ${err.message}`);
      }
    });

    // Start listening immediately
    httpServer.listen(config.port, () => {
      logger.info(`
╔════════════════════════════════════════════╗
║         LifeBridge API Server              ║
╠════════════════════════════════════════════╣
║  Status:   Running ✓                       ║
║  Port:     ${config.port}                          ║
║  Env:      ${config.env.padEnd(20)}     ║
║  Docs:     http://localhost:${config.port}/api-docs  ║
╚════════════════════════════════════════════╝
      `);
    });

    // Connect to database asynchronously so server starts instantly
    database.connect().catch((dbErr) => {
      logger.error(`Database connection warning: ${dbErr}`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string): Promise<void> => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      httpServer.close(async () => {
        await database.disconnect();
        logger.info('Server shut down successfully.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason: unknown) => {
      logger.error(`Unhandled Rejection: ${reason}`);
    });

    process.on('uncaughtException', (error: Error) => {
      logger.error(`Uncaught Exception: ${error.message}`);
      process.exit(1);
    });

  } catch (error) {
    logger.error(`Failed to start server: ${error}`);
    process.exit(1);
  }
};

startServer();
