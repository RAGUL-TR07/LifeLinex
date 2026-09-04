import { Request, Response, NextFunction } from 'express';
import ActivityLog from '../models/ActivityLog';
import logger from '../utils/logger';

export const auditLog = (action: string, resource: string) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      await ActivityLog.create({
        userId: req.userId,
        action,
        resource,
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.headers['user-agent'],
        metadata: {
          method: req.method,
          path: req.path,
          body: req.body,
        },
        success: true,
      });
    } catch (err) {
      logger.error(`Audit log failed: ${err}`);
    }
    next();
  };
};

export const requestLogger = (req: Request, _res: Response, next: NextFunction): void => {
  logger.info(`${req.method} ${req.originalUrl} - ${req.ip}`);
  next();
};
