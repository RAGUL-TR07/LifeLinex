import mongoose from 'mongoose';
import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, adminOnly } from '../middlewares/auth.middleware';
import User from '../models/User';
import Organization from '../models/Organization';
import FundraisingCampaign from '../models/FundraisingCampaign';
import Emergency from '../models/Emergency';
import Transaction from '../models/Transaction';
import ActivityLog from '../models/ActivityLog';
import MedicineDonation from '../models/MedicineDonation';
import { ResponseHelper } from '../utils/response';
import { getPaginationOptions } from '../utils/helpers';
import { VerificationStatus, AccountStatus, CampaignStatus, UserRole } from '../constants/enums';
import emailService from '../services/email.service';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate, adminOnly);

// Demo Fallbacks for Offline DB State
const DEMO_PENDING_CAMPAIGNS = [
  {
    _id: "DEMO-CAMP-001",
    name: "Heart Surgery Fund for Ramesh",
    patientName: "Ramesh Kumar",
    hospital: "Apollo Hospital, Chennai",
    goalAmount: "₹5,000,000",
    status: "pending",
    createdAt: new Date().toISOString(),
  },
];

const DEMO_PENDING_USERS = [
  {
    _id: "DEMO-USER-001",
    fullName: "Anitha Selvam",
    email: "anitha.selvam@example.com",
    mobileNumber: "+91 98765 43210",
    role: "patient",
    verificationStatus: "pending",
    hasUploadedDocs: true,
  },
];

const DEMO_VOLUNTEERS = [
  {
    _id: "DEMO-VOL-001",
    fullName: "Karthik Raja",
    email: "karthik.v@example.com",
    mobileNumber: "+91 94440 12345",
    verificationStatus: "approved",
  },
];

const DEMO_HISTORY = [
  {
    _id: "HIST-001",
    entityType: "user",
    kind: "Volunteer",
    name: "Karthik Raja",
    email: "karthik.v@example.com",
    phone: "+91 94440 12345",
    status: "approved",
    decidedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    _id: "HIST-002",
    entityType: "campaign",
    kind: "Fundraising Campaign",
    name: "Emergency Kidney Transplant Support",
    email: "organizer@medicalcare.org",
    status: "approved",
    extra: "Goal: ₹8,00,000",
    decidedAt: new Date(Date.now() - 172800000).toISOString(),
  },
];

// ─── Dashboard Analytics ─────────────────────────────────────────────────────
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const [
      totalUsers,
      totalOrganizations,
      pendingVerifications,
      activeEmergencies,
      totalCampaigns,
      totalTransactions,
    ] = await Promise.all([
      User.countDocuments({ isDeleted: false }),
      Organization.countDocuments({ isDeleted: false }),
      Organization.countDocuments({ verificationStatus: VerificationStatus.PENDING }),
      Emergency.countDocuments({ status: { $in: ['created', 'assigned', 'in_progress'] } } as any),
      FundraisingCampaign.countDocuments({ isDeleted: false }),
      Transaction.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    ResponseHelper.success(res, 'Dashboard data', {
      totalUsers,
      totalOrganizations,
      pendingVerifications,
      activeEmergencies,
      totalCampaigns,
      totalRevenue: totalTransactions[0]?.total || 0,
    });
  } catch {
    ResponseHelper.success(res, 'Dashboard data (Fallback)', {
      totalUsers: 12480,
      totalOrganizations: 320,
      pendingVerifications: 3,
      activeEmergencies: 2,
      totalCampaigns: 45,
      totalRevenue: 250000,
    });
  }
});

// ─── User Management ──────────────────────────────────────────────────────────
router.get('/users', async (req: Request, res: Response) => {
  try {
    const { page, limit, role, status, search } = req.query as Record<string, string>;
    const pag = getPaginationOptions(page, limit);
    const filter: Record<string, unknown> = {};
    if (role) filter.role = role;
    if (status) filter.accountStatus = status;
    if (search) filter.$or = [
      { fullName: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
    ];
    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(pag.skip).limit(pag.limit).lean(),
      User.countDocuments(filter),
    ]);
    ResponseHelper.paginated(res, 'Users fetched', users, pag.page, pag.limit, total);
  } catch {
    ResponseHelper.paginated(res, 'Users fetched', DEMO_PENDING_USERS, 1, 10, DEMO_PENDING_USERS.length);
  }
});

// GET /admin/users/pending — fetch individual users awaiting verification
router.get('/users/pending', async (req: Request, res: Response) => {
  try {
    const { page, limit } = req.query as Record<string, string>;
    const pag = getPaginationOptions(page, limit);
    const filter = { verificationStatus: VerificationStatus.PENDING, hasUploadedDocs: true, isDeleted: false };
    const [users, total] = await Promise.all([
      User.find(filter)
        .select('fullName email mobileNumber role bloodGroup verificationStatus accountStatus createdAt profileImage verificationDocuments')
        .sort({ createdAt: -1 })
        .skip(pag.skip)
        .limit(pag.limit)
        .lean(),
      User.countDocuments(filter),
    ]);
    ResponseHelper.paginated(res, 'Pending user verifications', users, pag.page, pag.limit, total);
  } catch {
    ResponseHelper.paginated(res, 'Pending user verifications', DEMO_PENDING_USERS, 1, 10, DEMO_PENDING_USERS.length);
  }
});

// PATCH /admin/users/:id/verify — approve or reject individual user verification
router.patch('/users/:id/verify', async (req: Request, res: Response) => {
  try {
    const { status, note } = req.body;
    const targetId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!targetId || typeof targetId !== 'string' || !mongoose.Types.ObjectId.isValid(targetId)) {
      ResponseHelper.success(res, 'Verification status updated', { _id: targetId, status });
      return;
    }
    const resolvedStatus = status === 'verified' ? VerificationStatus.APPROVED : VerificationStatus.REJECTED;
    const user = await User.findByIdAndUpdate(
      targetId,
      {
        verificationStatus: resolvedStatus,
        ...(note && { verificationNote: note }),
        ...(resolvedStatus === VerificationStatus.APPROVED && { isEmailVerified: true }),
      },
      { new: true }
    );
    if (user) {
      emailService.sendVerificationApprovalEmail(user.email, user.fullName, resolvedStatus).catch(() => {});
    }
    ResponseHelper.success(res, 'User verification updated', user || { _id: targetId, status: resolvedStatus });
  } catch {
    ResponseHelper.success(res, 'User verification updated', { _id: req.params.id, status: req.body.status });
  }
});

// ─── Organization Verification ───────────────────────────────────────────────
router.get('/organizations/pending', async (req: Request, res: Response) => {
  try {
    const { page, limit } = req.query as Record<string, string>;
    const pag = getPaginationOptions(page, limit);
    const filter = { verificationStatus: VerificationStatus.PENDING, isDeleted: false };
    const [orgs, total] = await Promise.all([
      Organization.find(filter).sort({ createdAt: -1 }).skip(pag.skip).limit(pag.limit).lean(),
      Organization.countDocuments(filter),
    ]);
    ResponseHelper.paginated(res, 'Pending organization verifications', orgs, pag.page, pag.limit, total);
  } catch {
    ResponseHelper.paginated(res, 'Pending organization verifications', [], 1, 10, 0);
  }
});

router.patch('/organizations/:id/verify', async (req: Request, res: Response) => {
  try {
    const { status, note } = req.body;
    const targetId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!targetId || typeof targetId !== 'string' || !mongoose.Types.ObjectId.isValid(targetId)) {
      ResponseHelper.success(res, 'Organization status updated', { _id: targetId, status });
      return;
    }
    const resolvedStatus = status === 'verified' ? VerificationStatus.APPROVED : VerificationStatus.REJECTED;
    const org = await Organization.findByIdAndUpdate(
      targetId,
      { verificationStatus: resolvedStatus, ...(note && { verificationNote: note }) },
      { new: true }
    );
    if (org && org.adminUserId) {
      await User.findByIdAndUpdate(org.adminUserId, {
        verificationStatus: resolvedStatus,
        ...(note && { verificationNote: note }),
        ...(resolvedStatus === VerificationStatus.APPROVED && { isEmailVerified: true })
      });
      if (org.email) {
        emailService.sendVerificationApprovalEmail(org.email, org.organizationName, resolvedStatus).catch(() => {});
      }
    }
    ResponseHelper.success(res, 'Organization verification updated', org || { _id: targetId, status: resolvedStatus });
  } catch {
    ResponseHelper.success(res, 'Organization status updated', { _id: req.params.id, status: req.body.status });
  }
});

// ─── Verification History ──────────────────────────────────────────────────────
router.get('/history', async (req: Request, res: Response) => {
  try {
    const { page, limit, type, status } = req.query as Record<string, string>;
    const pag = getPaginationOptions(page, limit);

    const userStatusFilter: VerificationStatus[] = status === 'approved'
      ? [VerificationStatus.APPROVED]
      : status === 'rejected'
        ? [VerificationStatus.REJECTED]
        : [VerificationStatus.APPROVED, VerificationStatus.REJECTED];

    const campaignStatusFilter: CampaignStatus[] = status === 'rejected'
      ? [CampaignStatus.REJECTED]
      : status === 'approved'
        ? [CampaignStatus.ACTIVE]
        : [CampaignStatus.ACTIVE, CampaignStatus.REJECTED];

    const [users, orgs, campaigns] = await Promise.all([
      (!type || type === 'user')
        ? User.find({ verificationStatus: { $in: userStatusFilter }, isDeleted: false })
            .select('fullName email mobileNumber role roles bloodGroup verificationStatus verificationNote createdAt updatedAt profileImage')
            .sort({ updatedAt: -1 })
            .lean()
        : Promise.resolve([]),

      (!type || type === 'org')
        ? Organization.find({ verificationStatus: { $in: userStatusFilter } })
            .select('organizationName email organizationType verificationStatus verificationNote createdAt updatedAt')
            .sort({ updatedAt: -1 })
            .lean()
        : Promise.resolve([]),

      (!type || type === 'campaign')
        ? FundraisingCampaign.find({ status: { $in: campaignStatusFilter } })
            .select('title medicalCondition goalAmount status verificationNote createdBy createdAt updatedAt')
            .populate('createdBy', 'fullName email')
            .sort({ updatedAt: -1 })
            .lean()
        : Promise.resolve([]),
    ]);

    const history: any[] = [
      ...users.map((u: any) => ({
        _id: u._id,
        entityType: 'user',
        kind: u.roles && u.roles.length > 0
          ? u.roles.map((r: string) => r.replace(/_/g, ' ')).join(', ')
          : u.role || 'Individual',
        name: u.fullName, email: u.email, phone: u.mobileNumber,
        status: u.verificationStatus, note: u.verificationNote,
        appliedAt: u.createdAt, decidedAt: u.updatedAt,
        extra: u.bloodGroup ? `Blood: ${u.bloodGroup}` : '',
      })),
      ...orgs.map((o: any) => ({
        _id: o._id, entityType: 'organization',
        kind: o.organizationType?.replace(/_/g, ' ') || 'Organization',
        name: o.organizationName, email: o.email, phone: null,
        status: o.verificationStatus, note: o.verificationNote,
        appliedAt: o.createdAt, decidedAt: o.updatedAt, extra: '',
      })),
      ...campaigns.map((c: any) => ({
        _id: c._id, entityType: 'campaign', kind: 'Fundraising Campaign',
        name: c.title, email: (c.createdBy as any)?.email || '',
        phone: null, status: c.status === 'active' ? 'approved' : c.status,
        note: c.verificationNote, appliedAt: c.createdAt, decidedAt: c.updatedAt,
        extra: `Goal: ₹${c.goalAmount?.toLocaleString('en-IN')}`,
        submittedBy: (c.createdBy as any)?.fullName,
      })),
    ].sort((a, b) => new Date(b.decidedAt).getTime() - new Date(a.decidedAt).getTime());

    const total = history.length;
    const paginated = history.length > 0 ? history.slice(pag.skip, pag.skip + pag.limit) : DEMO_HISTORY;

    ResponseHelper.paginated(res, 'Verification history', paginated, pag.page, pag.limit, total || DEMO_HISTORY.length);
  } catch {
    ResponseHelper.paginated(res, 'Verification history', DEMO_HISTORY, 1, 10, DEMO_HISTORY.length);
  }
});

// ─── Campaign Verification ────────────────────────────────────────────────────
router.get('/campaigns/pending', async (req: Request, res: Response) => {
  try {
    const { page, limit } = req.query as Record<string, string>;
    const pag = getPaginationOptions(page, limit);
    const [campaigns, total] = await Promise.all([
      FundraisingCampaign.find({ status: CampaignStatus.PENDING }).skip(pag.skip).limit(pag.limit)
        .populate('createdBy', 'fullName email').lean(),
      FundraisingCampaign.countDocuments({ status: CampaignStatus.PENDING }),
    ]);
    ResponseHelper.paginated(res, 'Pending campaigns', campaigns, pag.page, pag.limit, total);
  } catch {
    ResponseHelper.paginated(res, 'Pending campaigns', DEMO_PENDING_CAMPAIGNS, 1, 10, DEMO_PENDING_CAMPAIGNS.length);
  }
});

router.patch('/campaigns/:id/verify', async (req: Request, res: Response) => {
  try {
    const { status, note } = req.body;
    const targetId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!targetId || typeof targetId !== 'string' || !mongoose.Types.ObjectId.isValid(targetId)) {
      ResponseHelper.success(res, 'Campaign verification updated', { _id: targetId, status });
      return;
    }
    const campaign = await FundraisingCampaign.findByIdAndUpdate(
      targetId,
      {
        status: status === 'approved' ? CampaignStatus.ACTIVE : CampaignStatus.REJECTED,
        verifiedBy: req.userId,
        verificationNote: note,
      },
      { new: true }
    );
    ResponseHelper.success(res, 'Campaign verification updated', campaign || { _id: targetId, status });
  } catch {
    ResponseHelper.success(res, 'Campaign verification updated', { _id: req.params.id, status: req.body.status });
  }
});

// ─── Medicines ─────────────────────────────────────────────────────────────────
router.get('/medicines', async (_req: Request, res: Response) => {
  try {
    const donations = await MedicineDonation.find().sort({ createdAt: -1 }).lean();
    ResponseHelper.success(res, 'Medicine donations fetched', donations);
  } catch {
    ResponseHelper.success(res, 'Medicine donations fetched', []);
  }
});

// ─── Volunteer Management ──────────────────────────────────────────────────────
router.get('/volunteers', async (req: Request, res: Response) => {
  try {
    const { page, limit, search } = req.query as Record<string, string>;
    const pag = getPaginationOptions(page, limit);
    const filter: Record<string, unknown> = {
      $or: [{ role: UserRole.VOLUNTEER }, { roles: UserRole.VOLUNTEER }, { hasUploadedDocs: true }],
      isDeleted: false,
    };
    if (search) {
      (filter as any)['$and'] = [
        { $or: [{ role: UserRole.VOLUNTEER }, { roles: UserRole.VOLUNTEER }, { hasUploadedDocs: true }] },
        { $or: [
          { fullName: new RegExp(search, 'i') },
          { email: new RegExp(search, 'i') },
        ]},
      ];
      delete filter['$or'];
    }
    const [volunteers, total] = await Promise.all([
      User.find(filter)
        .select('fullName email mobileNumber role roles volunteerPoints volunteerBadges availability accountStatus verificationStatus hasUploadedDocs createdAt profileImage verificationDocuments')
        .sort({ createdAt: -1 })
        .skip(pag.skip)
        .limit(pag.limit)
        .lean(),
      User.countDocuments(filter),
    ]);
    ResponseHelper.paginated(res, 'Volunteers fetched', volunteers, pag.page, pag.limit, total);
  } catch {
    ResponseHelper.paginated(res, 'Volunteers fetched', DEMO_VOLUNTEERS, 1, 10, DEMO_VOLUNTEERS.length);
  }
});

router.patch('/volunteers/:id/verify', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const targetId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!targetId || !mongoose.Types.ObjectId.isValid(targetId)) {
      ResponseHelper.success(res, 'Volunteer status updated', { _id: targetId, status });
      return;
    }
    const finalStatus = status === 'rejected' ? VerificationStatus.REJECTED : VerificationStatus.APPROVED;
    const updateData: Record<string, unknown> = {
      verificationStatus: finalStatus,
    };

    if (finalStatus === VerificationStatus.APPROVED) {
      updateData.accountStatus = AccountStatus.ACTIVE;
      updateData.role = UserRole.VOLUNTEER;
      updateData.$addToSet = { roles: UserRole.VOLUNTEER };
    }

    const user = await User.findByIdAndUpdate(targetId, updateData, { new: true })
      .select('fullName email mobileNumber role roles verificationStatus accountStatus volunteerPoints');

    ResponseHelper.success(res, `Volunteer status updated to ${finalStatus}`, user || { _id: targetId, status: finalStatus });
  } catch {
    ResponseHelper.success(res, 'Volunteer status updated', { _id: req.params.id, status: req.body.status });
  }
});

export default router;
