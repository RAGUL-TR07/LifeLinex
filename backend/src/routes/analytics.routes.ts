import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, adminOnly } from '../middlewares/auth.middleware';
import User from '../models/User';
import Emergency from '../models/Emergency';
import Transaction from '../models/Transaction';
import BloodDonation from '../models/BloodDonation';
import FundraisingCampaign from '../models/FundraisingCampaign';
import { ResponseHelper } from '../utils/response';

const router = Router();

// GET /analytics/overview (admin)
router.get('/overview', authenticate, adminOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      newUsersThisMonth,
      emergenciesThisMonth,
      transactionsThisMonth,
      bloodDonationsThisMonth,
      usersByRole,
      emergenciesByType,
    ] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: thisMonth } }),
      Emergency.countDocuments({ createdAt: { $gte: thisMonth } }),
      Transaction.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: thisMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      BloodDonation.countDocuments({ createdAt: { $gte: thisMonth } }),
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      Emergency.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]),
    ]);

    ResponseHelper.success(res, 'Analytics overview', {
      newUsersThisMonth,
      emergenciesThisMonth,
      revenueThisMonth: transactionsThisMonth[0]?.total || 0,
      transactionsThisMonth: transactionsThisMonth[0]?.count || 0,
      bloodDonationsThisMonth,
      usersByRole,
      emergenciesByType,
    });
  } catch (err) { next(err); }
});

// GET /analytics/trends (admin)
router.get('/trends', authenticate, adminOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const last6Months = new Date();
    last6Months.setMonth(last6Months.getMonth() - 6);

    const monthlyUsers = await User.aggregate([
      { $match: { createdAt: { $gte: last6Months } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const monthlyRevenue = await Transaction.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: last6Months } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    ResponseHelper.success(res, 'Trends data', { monthlyUsers, monthlyRevenue });
  } catch (err) { next(err); }
});

export default router;
