import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { ResponseHelper } from '../utils/response';
import { HTTP_STATUS } from '../constants';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public errors?: unknown[];

  constructor(message: string, statusCode: number = 500, errors?: unknown[]) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    userId: req.userId,
  });

  if (err instanceof AppError) {
    ResponseHelper.error(res, err.message, err.statusCode, err.errors);
    return;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values((err as unknown as { errors: Record<string, { message: string }> }).errors).map(
      (e) => ({ message: e.message })
    );
    ResponseHelper.error(res, 'Validation failed', HTTP_STATUS.BAD_REQUEST, errors);
    return;
  }

  // Mongoose duplicate key (E11000)
  if ((err as unknown as { code: number }).code === 11000) {
    const keyPattern = (err as unknown as { keyPattern?: Record<string, unknown> }).keyPattern || {};
    const keyValue = (err as unknown as { keyValue?: Record<string, unknown> }).keyValue || {};
    const field = Object.keys(keyPattern)[0] || Object.keys(keyValue)[0] || '';
    const fieldMessages: Record<string, string> = {
      email: 'This email address is already registered. Please sign in or use a different email.',
      mobileNumber: 'This mobile number is already registered. Please use a different number.',
    };
    ResponseHelper.error(
      res,
      fieldMessages[field] ?? 'An account with these details already exists.',
      HTTP_STATUS.CONFLICT
    );
    return;
  }

  // Mongoose cast error
  if (err.name === 'CastError') {
    ResponseHelper.error(res, 'Invalid ID format', HTTP_STATUS.BAD_REQUEST);
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    ResponseHelper.error(res, 'Invalid token', HTTP_STATUS.UNAUTHORIZED);
    return;
  }

  if (err.name === 'TokenExpiredError') {
    ResponseHelper.error(res, 'Token expired', HTTP_STATUS.UNAUTHORIZED);
    return;
  }

  // Mongoose buffering / connection timeout errors → 503
  if (
    err.message?.includes('bufferCommands') ||
    err.message?.includes('buffering timed out') ||
    err.message?.includes('MongooseError') ||
    err.message?.includes('initial connection') ||
    err.message?.includes('ECONNREFUSED') ||
    err.message?.includes('ETIMEDOUT')
  ) {
    ResponseHelper.error(
      res,
      'Database is connecting. Please try again in a moment, or use a demo account (user@lifelinex.com or user@test.com).',
      503
    );
    return;
  }

  // Default internal server error
  ResponseHelper.error(
    res,
    process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    HTTP_STATUS.INTERNAL_SERVER_ERROR
  );
};

export const notFound = (req: Request, res: Response): void => {
  ResponseHelper.error(
    res,
    `Route ${req.method} ${req.originalUrl} not found`,
    HTTP_STATUS.NOT_FOUND
  );
};
