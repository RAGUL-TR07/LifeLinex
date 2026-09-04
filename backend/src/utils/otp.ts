import crypto from 'crypto';
import { OTP } from '../constants';

export const generateOTP = (): string => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < OTP.LENGTH; i++) {
    const randomIndex = crypto.randomInt(0, digits.length);
    otp += digits[randomIndex];
  }
  return otp;
};

export const getOTPExpiry = (): Date => {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + OTP.EXPIRES_IN_MINUTES);
  return expiry;
};

export const hashOTP = (otp: string): string => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

export const verifyHashedOTP = (otp: string, hashedOTP: string): boolean => {
  return crypto.createHash('sha256').update(otp).digest('hex') === hashedOTP;
};

export const generateRandomToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};
