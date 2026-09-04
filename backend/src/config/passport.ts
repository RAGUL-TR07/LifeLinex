import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import config from './index';
import authService from '../services/auth.service';
import logger from '../utils/logger';

export function initPassport(): void {
  if (!config.google.clientId || !config.google.clientSecret) {
    logger.warn('Google OAuth credentials not configured — Google login will not work.');
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: config.google.clientId,
        clientSecret: config.google.clientSecret,
        callbackURL: config.google.callbackUrl,
        scope: ['profile', 'email'],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email =
            profile.emails?.[0]?.value ?? `${profile.id}@google.com`;
          const photo = profile.photos?.[0]?.value;

          const result = await authService.googleAuth({
            googleId: profile.id,
            email,
            displayName: profile.displayName || 'Google User',
            photo,
          });

          return done(null, result as unknown as Express.User);
        } catch (err) {
          return done(err as Error);
        }
      }
    )
  );

  // Stateless JWT — no session serialization needed
  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user, done) => done(null, user as Express.User));
}

export default passport;
