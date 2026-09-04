import { z } from 'zod';
import { AccountType, OrganizationType, UserRole } from '../constants/enums';

export const registerIndividualSchema = z.object({
  fullName: z
    .string({ required_error: 'Full name is required' })
    .min(2, 'Name must be at least 2 characters')
    .max(100),
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email address'),
  mobileNumber: z
    .string({ required_error: 'Mobile number is required' })
    .transform((val) => val.replace(/^\+91\s?/, '').replace(/\s/g, ''))
    .pipe(z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number (10 digits starting with 6-9)')),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().optional(),
  role: z.nativeEnum(UserRole, { errorMap: () => ({ message: 'Invalid role' }) }).default(UserRole.PATIENT),
  accountType: z.nativeEnum(AccountType).optional().default(AccountType.INDIVIDUAL),
  acceptTerms: z.boolean().optional(),
});

export const registerOrganizationSchema = z.object({
  organizationName: z
    .string({ required_error: 'Organization name is required' })
    .min(3)
    .max(200),
  organizationType: z.nativeEnum(OrganizationType, {
    errorMap: () => ({ message: 'Invalid organization type' }),
  }).default(OrganizationType.HOSPITAL),
  email: z.string({ required_error: 'Email is required' }).email(),
  mobileNumber: z
    .string({ required_error: 'Mobile number is required' })
    .transform((val) => val.replace(/^\+91\s?/, '').replace(/\s/g, ''))
    .pipe(z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number (10 digits starting with 6-9)')),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8),
  registrationNumber: z
    .string({ required_error: 'Registration number is required' })
    .min(3),
  licenseDocument: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional().default(''),
    state: z.string().optional().default(''),
    pincode: z.string().optional(),
    country: z.string().default('India'),
  }).optional().default({}),
});

export const loginSchema = z.object({
  email: z.string({ required_error: 'Email is required' }).email(),
  password: z.string({ required_error: 'Password is required' }),
  rememberMe: z.boolean().optional().default(false),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string({ required_error: 'Refresh token is required' }),
});

export const forgotPasswordSchema = z.object({
  email: z.string({ required_error: 'Email is required' }).email(),
});

export const resetPasswordSchema = z.object({
  token: z.string({ required_error: 'Reset token is required' }),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Weak password'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const changePasswordSchema = z.object({
  currentPassword: z.string({ required_error: 'Current password is required' }),
  newPassword: z
    .string({ required_error: 'New password is required' })
    .min(8)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Weak password'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const verifyOTPSchema = z.object({
  otp: z
    .string({ required_error: 'OTP is required' })
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d+$/, 'OTP must be numeric'),
  type: z.string({ required_error: 'OTP type is required' }),
});

export type RegisterIndividualDto = z.infer<typeof registerIndividualSchema>;
export type RegisterOrganizationDto = z.infer<typeof registerOrganizationSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;
export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;
export type VerifyOTPDto = z.infer<typeof verifyOTPSchema>;
