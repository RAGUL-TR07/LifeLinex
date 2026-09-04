import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import Organization from '../models/Organization';
import { ResponseHelper } from '../utils/response';
import { getPaginationOptions } from '../utils/helpers';
import { UserRole, VerificationStatus } from '../constants/enums';
import { getIO } from '../socket/socket';
import { SocketEvents } from '../constants/enums';

const router = Router();

// GET /hospitals - Public list of verified hospitals
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, city, state, latitude, longitude, maxDistance = '50' } = req.query as Record<string, string>;
    const pag = getPaginationOptions(page, limit);
    let filter: Record<string, unknown> = { organizationType: 'hospital', verificationStatus: VerificationStatus.APPROVED };
    if (city) filter['address.city'] = new RegExp(city, 'i');
    if (state) filter['address.state'] = new RegExp(state, 'i');

    if (latitude && longitude) {
      (filter as Record<string, unknown>).location = {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
          $maxDistance: parseFloat(maxDistance) * 1000,
        },
      };
    }

    const [hospitals, total] = await Promise.all([
      Organization.find(filter).skip(pag.skip).limit(pag.limit)
        .select('-documents -adminUserId'),
      Organization.countDocuments(filter),
    ]);
    ResponseHelper.paginated(res, 'Hospitals fetched', hospitals, pag.page, pag.limit, total);
  } catch (err) { next(err); }
});

// GET /hospitals/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hospital = await Organization.findOne({ _id: req.params.id, organizationType: 'hospital' } as any);
    if (!hospital) { ResponseHelper.error(res, 'Hospital not found', 404); return; }
    ResponseHelper.success(res, 'Hospital fetched', hospital);
  } catch (err) { next(err); }
});

// PUT /hospitals/:id/resources - Update hospital resources (Hospital admin only)
router.put('/:id/resources', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { totalBeds, availableBeds, icuBeds, ventilators, hasEmergencyWard, departments } = req.body;
    const hospital = await Organization.findByIdAndUpdate(
      req.params.id,
      { $set: { totalBeds, availableBeds, icuBeds, ventilators, hasEmergencyWard, departments } },
      { new: true }
    );

    const io = getIO();
    io.emit(SocketEvents.HOSPITAL_RESOURCES_UPDATED, { hospital });

    ResponseHelper.success(res, 'Hospital resources updated', hospital);
  } catch (err) { next(err); }
});

// PUT /hospitals/:id/blood-inventory - Update blood inventory
router.put('/:id/blood-inventory', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bloodInventory } = req.body;
    const hospital = await Organization.findByIdAndUpdate(
      req.params.id,
      { $set: { bloodInventory } },
      { new: true }
    );
    ResponseHelper.success(res, 'Blood inventory updated', hospital);
  } catch (err) { next(err); }
});

// GET /hospitals/nearby
router.get('/search/nearby', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { latitude, longitude, maxDistance = '20' } = req.query as Record<string, string>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hospitals = await (Organization.find as any)({
      organizationType: 'hospital',
      verificationStatus: VerificationStatus.APPROVED,
      location: {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
          $maxDistance: parseFloat(maxDistance) * 1000,
        },
      },
    }).limit(10);
    ResponseHelper.success(res, 'Nearby hospitals', hospitals);
  } catch (err) { next(err); }
});

export default router;
