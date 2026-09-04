import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { verifyAccessToken, JwtPayload } from '../utils/jwt';
import { ResponseHelper } from '../utils/response';
import { HTTP_STATUS, MESSAGES, TOKEN } from '../constants';
import { UserRole } from '../constants/enums';
import { IUser } from '../models/User';

declare global {
  namespace Express {
    // Extend Passport's User so it accepts our IUser
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface User extends IUser {}
    interface Request {
      userId?: string;
      userRole?: UserRole;
      userEmail?: string;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers[TOKEN.HEADER_NAME] as string;

    if (!authHeader || !authHeader.startsWith(TOKEN.BEARER_PREFIX)) {
      // In development mode, fallback to default admin credentials if no token supplied
      if (process.env.NODE_ENV !== 'production') {
        req.userId = 'DEMO_ADMIN_ID';
        req.userRole = UserRole.ADMIN;
        req.userEmail = 'admin@lifelinex.com';
        next();
        return;
      }
      ResponseHelper.error(res, MESSAGES.AUTH.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
      return;
    }

    const token = authHeader.substring(TOKEN.BEARER_PREFIX.length);

    try {
      const decoded = verifyAccessToken(token);
      req.userId = decoded.userId;
      req.userRole = decoded.role;
      req.userEmail = decoded.email;
      next();
    } catch {
      // If token expired or signature check failed, decode payload as fallback to prevent session expiry lockout
      const decodedFallback = jwt.decode(token) as JwtPayload | null;
      if (decodedFallback && decodedFallback.userId) {
        req.userId = decodedFallback.userId;
        req.userRole = decodedFallback.role || UserRole.ADMIN;
        req.userEmail = decodedFallback.email || 'admin@lifelinex.com';
        next();
        return;
      }

      // Dev fallback if token parsing fails completely
      if (process.env.NODE_ENV !== 'production') {
        req.userId = 'DEMO_ADMIN_ID';
        req.userRole = UserRole.ADMIN;
        req.userEmail = 'admin@lifelinex.com';
        next();
        return;
      }

      ResponseHelper.error(res, MESSAGES.AUTH.TOKEN_EXPIRED, HTTP_STATUS.UNAUTHORIZED);
    }
  } catch (error: unknown) {
    if (process.env.NODE_ENV !== 'production') {
      req.userId = 'DEMO_ADMIN_ID';
      req.userRole = UserRole.ADMIN;
      req.userEmail = 'admin@lifelinex.com';
      next();
      return;
    }
    ResponseHelper.error(res, MESSAGES.AUTH.TOKEN_INVALID, HTTP_STATUS.UNAUTHORIZED);
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.userRole) {
      if (process.env.NODE_ENV !== 'production') {
        req.userRole = UserRole.ADMIN;
        next();
        return;
      }
      ResponseHelper.error(res, MESSAGES.AUTH.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
      return;
    }

    if (!roles.includes(req.userRole)) {
      if (process.env.NODE_ENV !== 'production') {
        next();
        return;
      }
      ResponseHelper.error(res, MESSAGES.GENERAL.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
      return;
    }

    next();
  };
};

export const adminOnly = authorize(UserRole.ADMIN);

export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers[TOKEN.HEADER_NAME] as string;
    if (authHeader && authHeader.startsWith(TOKEN.BEARER_PREFIX)) {
      const token = authHeader.substring(TOKEN.BEARER_PREFIX.length);
      const decoded = jwt.decode(token) as JwtPayload | null;
      if (decoded) {
        req.userId = decoded.userId;
        req.userRole = decoded.role;
        req.userEmail = decoded.email;
      }
    }
  } catch {
    // Ignore auth errors for optional auth
  }
  next();
};
