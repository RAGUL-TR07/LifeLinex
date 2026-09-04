import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import config from '../config';
import { UserRole } from '../constants/enums';
import mongoose from 'mongoose';

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  accountType: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  tokenId: string;
  userId: string;
  iat?: number;
  exp?: number;
}

export const generateAccessToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
  } as jwt.SignOptions);
};

export const generateRefreshToken = (userId: string): { token: string; tokenId: string } => {
  const tokenId = uuidv4();
  const token = jwt.sign(
    { tokenId, userId } as RefreshTokenPayload,
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn } as jwt.SignOptions
  );
  return { token, tokenId };
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.jwt.accessSecret) as JwtPayload;
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return jwt.verify(token, config.jwt.refreshSecret) as RefreshTokenPayload;
};

export const getRefreshTokenExpiry = (): Date => {
  const expiry = new Date();
  const days = parseInt(config.jwt.refreshExpiresIn.replace('d', ''), 10);
  expiry.setDate(expiry.getDate() + days);
  return expiry;
};

export const isValidObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};
