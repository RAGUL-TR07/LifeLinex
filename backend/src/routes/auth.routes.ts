import { Router } from 'express';
import passport from 'passport';
import authController from '../controllers/auth.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import {
  registerIndividualSchema,
  registerOrganizationSchema,
  loginSchema,
  forgotPasswordSchema,
  changePasswordSchema,
  refreshTokenSchema,
} from '../validators/auth.validator';

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */
const router = Router();

// ─── Individual Registration ───────────────────────────────────────────────
/**
 * @swagger
 * /auth/register/individual:
 *   post:
 *     summary: Register individual user (Patient, Donor, Volunteer, etc.)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterIndividual'
 *     responses:
 *       201:
 *         description: Registered successfully, OTP sent
 *       409:
 *         description: Email or mobile already exists
 */
router.post(
  '/register/individual',
  validate(registerIndividualSchema),
  authController.registerIndividual
);

// ─── Organization Registration ─────────────────────────────────────────────
/**
 * @swagger
 * /auth/register/organization:
 *   post:
 *     summary: Register organization (Hospital, Blood Bank, NGO, etc.)
 *     tags: [Auth]
 */
router.post(
  '/register/organization',
  validate(registerOrganizationSchema),
  authController.registerOrganization
);

// ─── Login ─────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login (all users except admin)
 *     tags: [Auth]
 */
router.post('/login', validate(loginSchema), authController.login);

// ─── Admin Login ───────────────────────────────────────────────────────────
/**
 * @swagger
 * /auth/admin/login:
 *   post:
 *     summary: Admin portal login
 *     tags: [Auth]
 */
router.post('/admin/login', validate(loginSchema), authController.adminLogin);

// ─── Refresh Token ─────────────────────────────────────────────────────────
router.post('/refresh', validate(refreshTokenSchema), authController.refreshToken);

// ─── Logout ────────────────────────────────────────────────────────────────
router.post('/logout', authController.logout);

// ─── OTP ───────────────────────────────────────────────────────────────────
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-otp', authController.resendOTP);

// ─── Password ──────────────────────────────────────────────────────────────
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword
);

// ─── Me ────────────────────────────────────────────────────────────────────
router.get('/me', authenticate, authController.getMe);

// ─── Google OAuth ─────────────────────────────────────────────────────────
// Initiate Google OAuth flow
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    state: false,   // disable session-based state check (no express-session)
    prompt: 'select_account',
  } as any)
);

// Google OAuth callback — Passport finishes verification and calls authController
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    state: false,
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:8081'}/login?error=oauth_failed`,
  } as any),
  authController.googleCallback
);

export default router;
