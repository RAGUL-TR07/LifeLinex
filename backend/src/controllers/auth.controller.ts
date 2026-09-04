import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service';
import { ResponseHelper } from '../utils/response';
import { HTTP_STATUS, MESSAGES } from '../constants';
import { OTPType } from '../constants/enums';
import type {
  RegisterIndividualDto,
  RegisterOrganizationDto,
  LoginDto,
} from '../validators/auth.validator';

class AuthController {
  // POST /auth/register/individual
  async registerIndividual(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = req.body as RegisterIndividualDto;
      const result = await authService.registerIndividual(dto);
      ResponseHelper.created(res, MESSAGES.AUTH.REGISTERED, result);
    } catch (error) {
      next(error);
    }
  }

  // POST /auth/register/organization
  async registerOrganization(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = req.body as RegisterOrganizationDto;
      const result = await authService.registerOrganization(dto);
      ResponseHelper.created(res, MESSAGES.AUTH.REGISTERED, result);
    } catch (error) {
      next(error);
    }
  }

  // POST /auth/login
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = req.body as LoginDto;
      const deviceInfo = req.headers['user-agent'];
      const ipAddress = req.ip;
      const result = await authService.login(dto, deviceInfo, ipAddress);
      ResponseHelper.success(res, MESSAGES.AUTH.LOGIN_SUCCESS, result);
    } catch (error) {
      next(error);
    }
  }

  // POST /auth/admin/login
  async adminLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body as { email: string; password: string };
      const result = await authService.adminLogin(email, password);
      ResponseHelper.success(res, MESSAGES.AUTH.LOGIN_SUCCESS, result);
    } catch (error) {
      next(error);
    }
  }

  // POST /auth/refresh
  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body as { refreshToken: string };
      const tokens = await authService.refreshToken(refreshToken, req.headers['user-agent'], req.ip);
      ResponseHelper.success(res, MESSAGES.AUTH.TOKEN_REFRESHED, tokens);
    } catch (error) {
      next(error);
    }
  }

  // POST /auth/logout
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body as { refreshToken?: string };
      await authService.logout(refreshToken);
      ResponseHelper.success(res, MESSAGES.AUTH.LOGOUT_SUCCESS);
    } catch (error) {
      next(error);
    }
  }

  // POST /auth/verify-email
  async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { otp, userId } = req.body as { otp: string; userId: string };
      await authService.verifyEmailOTP(userId, otp);
      ResponseHelper.success(res, MESSAGES.AUTH.EMAIL_VERIFIED);
    } catch (error) {
      next(error);
    }
  }

  // POST /auth/resend-otp
  async resendOTP(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId, type } = req.body as { userId: string; type: OTPType };
      await authService.resendOTP(userId, type);
      ResponseHelper.success(res, MESSAGES.AUTH.OTP_SENT);
    } catch (error) {
      next(error);
    }
  }

  // POST /auth/forgot-password
  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body as { email: string };
      await authService.forgotPassword(email);
      ResponseHelper.success(res, MESSAGES.AUTH.PASSWORD_RESET_SENT);
    } catch (error) {
      next(error);
    }
  }

  // POST /auth/reset-password
  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, otp, password } = req.body as {
        email: string;
        otp: string;
        password: string;
      };
      await authService.resetPassword(email, otp, password);
      ResponseHelper.success(res, MESSAGES.AUTH.PASSWORD_RESET_SUCCESS);
    } catch (error) {
      next(error);
    }
  }

  // POST /auth/change-password (authenticated)
  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body as {
        currentPassword: string;
        newPassword: string;
      };
      await authService.changePassword(req.userId!, currentPassword, newPassword);
      ResponseHelper.success(res, MESSAGES.AUTH.PASSWORD_CHANGED);
    } catch (error) {
      next(error);
    }
  }

  // GET /auth/me (authenticated)
  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await (await import('../repositories/user.repository')).default.findById(req.userId!);
      if (!user) {
        ResponseHelper.error(res, MESSAGES.USER.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
        return;
      }
      ResponseHelper.success(res, MESSAGES.USER.PROFILE_FETCHED, user);
    } catch (error) {
      next(error);
    }
  }

  // Google OAuth callback
  async googleCallback(req: Request, res: Response): Promise<void> {
    const result = (req.user as unknown) as { user: unknown; tokens: { accessToken: string; refreshToken: string } };
    const { accessToken, refreshToken } = result.tokens;
    res.redirect(
      `${process.env.FRONTEND_URL}/auth/google/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`
    );
  }
}

export default new AuthController();
