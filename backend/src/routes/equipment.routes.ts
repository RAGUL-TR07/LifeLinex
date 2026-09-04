import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import MedicalEquipment from '../models/MedicalEquipment';
import { ResponseHelper } from '../utils/response';
import { getPaginationOptions } from '../utils/helpers';
import { EquipmentStatus } from '../constants/enums';

const router = Router();

// GET /equipment - Public list of available equipment
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, category, latitude, longitude, maxDistance = '50' } = req.query as Record<string, string>;
    const pag = getPaginationOptions(page, limit);
    const filter: Record<string, unknown> = { status: EquipmentStatus.AVAILABLE, isDeleted: false };
    if (category) filter.category = category;
    if (latitude && longitude) {
      filter.location = {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
          $maxDistance: parseFloat(maxDistance) * 1000,
        },
      };
    }
    const [equipment, total] = await Promise.all([
      MedicalEquipment.find(filter).skip(pag.skip).limit(pag.limit),
      MedicalEquipment.countDocuments(filter),
    ]);
    ResponseHelper.paginated(res, 'Equipment fetched', equipment, pag.page, pag.limit, total);
  } catch (err) { next(err); }
});

// POST /equipment
router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, category, condition, description, latitude, longitude, address, isAvailableForDonation } = req.body;
    const equipment = await MedicalEquipment.create({
      name, category, condition, description,
      ownerId: req.userId,
      ownerType: 'User',
      location: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)], address },
      isAvailableForDonation,
    });
    ResponseHelper.created(res, 'Equipment listed', equipment);
  } catch (err) { next(err); }
});

// POST /equipment/:id/transfer
router.post('/:id/transfer', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { toId } = req.body;
    const equipment = await MedicalEquipment.findByIdAndUpdate(
      req.params.id,
      {
        $push: { transferHistory: { fromId: req.userId, toId, date: new Date() } },
        $set: { ownerId: toId, status: EquipmentStatus.DONATED },
      },
      { new: true }
    );
    ResponseHelper.success(res, 'Equipment transferred', equipment);
  } catch (err) { next(err); }
});

export default router;
