import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import emergencyService from '../services/emergency.service';
import { ResponseHelper } from '../utils/response';
import { HTTP_STATUS, MESSAGES } from '../constants';
import { getPaginationOptions } from '../utils/helpers';
import { EmergencyStatus } from '../constants/enums';

const router = Router();

// POST /emergencies
router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, description, severity, latitude, longitude, address, familyMemberIds } = req.body;
    const emergency = await emergencyService.createEmergency({
      patientId: req.userId!,
      type, description, severity,
      coordinates: [parseFloat(longitude), parseFloat(latitude)],
      address, familyMemberIds,
    });
    ResponseHelper.created(res, MESSAGES.EMERGENCY.CREATED, emergency);
  } catch (err) { next(err); }
});

// GET /emergencies
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, status, severity } = req.query as Record<string, string>;
    const pag = getPaginationOptions(page, limit);
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (severity) filter.severity = severity;
    const { emergencies, total } = await emergencyService.getEmergencies(filter, pag.page, pag.limit);
    ResponseHelper.paginated(res, 'Emergencies fetched', emergencies, pag.page, pag.limit, total);
  } catch (err) { next(err); }
});

// GET /emergencies/my
router.get('/my', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = req.query as Record<string, string>;
    const pag = getPaginationOptions(page, limit);
    const { emergencies, total } = await emergencyService.getEmergencies(
      { patientId: req.userId },
      pag.page,
      pag.limit
    );
    ResponseHelper.paginated(res, 'My emergencies fetched', emergencies, pag.page, pag.limit, total);
  } catch (err) { next(err); }
});

// GET /emergencies/:id
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const emergency = await emergencyService.getEmergencyById(req.params.id as string);
    ResponseHelper.success(res, 'Emergency fetched', emergency);
  } catch (err) { next(err); }
});

// PUT /emergencies/:id
router.put('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const emergency = await emergencyService.updateEmergency(req.params.id as string, req.userId!, req.body);
    ResponseHelper.success(res, MESSAGES.EMERGENCY.UPDATED, emergency);
  } catch (err) { next(err); }
});

// POST /emergencies/:id/cancel
router.post('/:id/cancel', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const emergency = await emergencyService.cancelEmergency(req.params.id as string, req.userId!);
    ResponseHelper.success(res, MESSAGES.EMERGENCY.CANCELLED, emergency);
  } catch (err) { next(err); }
});

// POST /emergencies/:id/assign-volunteer
router.post('/:id/assign-volunteer', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { volunteerId } = req.body;
    const emergency = await emergencyService.assignVolunteer(req.params.id as string, volunteerId || req.userId!);
    ResponseHelper.success(res, 'Volunteer assigned', emergency);
  } catch (err) { next(err); }
});

export default router;
