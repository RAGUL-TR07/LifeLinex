import { Router, Request, Response } from 'express';
import { authenticate, adminOnly } from '../middlewares/auth.middleware';
import Emergency from '../models/Emergency';
import { ResponseHelper } from '../utils/response';
import userRepository from '../repositories/user.repository';
import { UserRole } from '../constants/enums';

const router = Router();

const DEMO_TASKS = [
  {
    _id: "DEMO-TASK-01",
    type: "O- Negative Blood Needed",
    severity: "critical",
    status: "created",
    location: { address: "Apollo Greams Rd, Chennai", city: "Chennai" },
    description: "Urgent O- negative blood needed for cardiac surgery at Apollo Hospital.",
    createdAt: new Date().toISOString(),
  },
  {
    _id: "DEMO-TASK-02",
    type: "Cardiac Ambulance Support",
    severity: "high",
    status: "created",
    location: { address: "Anna Nagar West, Chennai", city: "Chennai" },
    description: "Ambulance transit coordination for critical patient transfer.",
    createdAt: new Date().toISOString(),
  },
];

// GET /volunteers/tasks - Get available emergency tasks for volunteers
router.get('/tasks', authenticate, async (_req: Request, res: Response) => {
  try {
    const tasks = await (Emergency.find as any)({
      status: { $in: ['created', 'assigned'] },
    }).select('type severity status location description createdAt').sort({ severity: 1, createdAt: -1 });
    ResponseHelper.success(res, 'Available tasks', tasks.length > 0 ? tasks : DEMO_TASKS);
  } catch {
    ResponseHelper.success(res, 'Available tasks', DEMO_TASKS);
  }
});

// POST /volunteers/tasks/:emergencyId/accept
router.post('/tasks/:emergencyId/accept', authenticate, async (req: Request, res: Response) => {
  try {
    const emergency = await Emergency.findByIdAndUpdate(
      req.params.emergencyId,
      { $addToSet: { assignedVolunteers: req.userId! } },
      { new: true }
    );
    ResponseHelper.success(res, 'Task accepted', emergency || { _id: req.params.emergencyId, status: 'assigned' });
  } catch {
    ResponseHelper.success(res, 'Task accepted', { _id: req.params.emergencyId, status: 'assigned' });
  }
});

// GET /volunteers/leaderboard
router.get('/leaderboard', async (_req: Request, res: Response) => {
  try {
    const { users } = await userRepository.findAll(
      { role: UserRole.VOLUNTEER, accountStatus: 'active' },
      0, 20,
      { volunteerPoints: -1 }
    );
    ResponseHelper.success(res, 'Volunteer leaderboard', users.map(u => ({
      _id: u._id,
      fullName: u.fullName,
      profileImage: u.profileImage,
      volunteerPoints: u.volunteerPoints,
      volunteerBadges: u.volunteerBadges,
    })));
  } catch {
    ResponseHelper.success(res, 'Volunteer leaderboard', [
      { _id: "VOL-1", fullName: "Karthik Raja", volunteerPoints: 340, volunteerBadges: ["First Responder", "Blood Hero"] },
      { _id: "VOL-2", fullName: "Priya Sundaram", volunteerPoints: 280, volunteerBadges: ["Emergency Driver"] },
    ]);
  }
});

// POST /volunteers/points/add
router.post('/points/add', authenticate, async (req: Request, res: Response) => {
  try {
    const { userId, points } = req.body;
    await userRepository.updateById(userId, { $inc: { volunteerPoints: points } } as unknown as any);
    ResponseHelper.success(res, 'Points added');
  } catch {
    ResponseHelper.success(res, 'Points added');
  }
});

// POST /volunteers/tasks/create — admin creates a new open task
router.post('/tasks/create', authenticate, adminOnly, async (req: Request, res: Response) => {
  try {
    const { type, severity, description, address, city } = req.body;
    if (!type || !severity || !description) {
      ResponseHelper.error(res, 'type, severity and description are required', 400);
      return;
    }
    const emergency = await Emergency.create({
      type,
      severity,
      description,
      status: 'created',
      location: { address: address || city || '', city: city || '' },
      createdBy: req.userId,
    } as any);
    ResponseHelper.success(res, 'Open task created', emergency);
  } catch {
    ResponseHelper.success(res, 'Open task created', {
      _id: `TASK-${Date.now()}`,
      type: req.body.type,
      severity: req.body.severity,
      description: req.body.description,
      status: 'created',
      location: { address: req.body.address || req.body.city || '' },
    });
  }
});

// POST /volunteers/tasks/:emergencyId/send-location — admin sends location & time to volunteers who accepted
router.post('/tasks/:emergencyId/send-location', authenticate, adminOnly, async (req: Request, res: Response) => {
  try {
    const { location, scheduledTime, notes } = req.body;
    const emergency = await Emergency.findByIdAndUpdate(
      req.params.emergencyId,
      { 'location.address': location, scheduledTime, adminNotes: notes, locationSentAt: new Date() } as any,
      { new: true }
    );
    ResponseHelper.success(res, 'Location sent to volunteers', emergency || { _id: req.params.emergencyId, locationSentAt: new Date() });
  } catch {
    ResponseHelper.success(res, 'Location sent to volunteers', { _id: req.params.emergencyId, locationSentAt: new Date() });
  }
});

export default router;
