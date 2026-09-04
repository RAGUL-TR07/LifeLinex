import cron from 'node-cron';
import refreshTokenRepository from '../repositories/refreshToken.repository';
import BloodRequest from '../models/BloodRequest';
import logger from '../utils/logger';

export const startJobs = (): void => {
  // ── Cleanup expired refresh tokens (daily at 2am) ─────────────────────────
  cron.schedule('0 2 * * *', async () => {
    try {
      await refreshTokenRepository.cleanupExpired();
      logger.info('Cron: Expired refresh tokens cleaned up');
    } catch (err) {
      logger.error(`Cron: Refresh token cleanup failed: ${err}`);
    }
  });

  // ── Expire old blood requests (every hour) ────────────────────────────────
  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date();
      const result = await BloodRequest.updateMany(
        { requiredBy: { $lt: now }, status: { $in: ['Pending', 'Searching', 'Accepted', 'Donor Assigned', 'Hospital Assigned', 'Blood Reserved'] } } as any,
        { $set: { status: 'Expired' } } as any
      );
      if (result.modifiedCount > 0) {
        logger.info(`Cron: ${result.modifiedCount} blood requests marked as expired`);
      }
    } catch (err) {
      logger.error(`Cron: Blood request expiry job failed: ${err}`);
    }
  });

  // ── Send summary notifications (weekly on Monday 9am) ─────────────────────
  cron.schedule('0 9 * * 1', async () => {
    logger.info('Cron: Weekly summary job running');
  });

  logger.info('Cron jobs started');
};
