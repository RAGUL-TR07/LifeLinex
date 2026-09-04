import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import MedicineDonation from '../models/MedicineDonation';
import { ResponseHelper } from '../utils/response';
import { getPaginationOptions } from '../utils/helpers';
import { MedicineDonationStatus } from '../constants/enums';

const router = Router();

// POST /medicines/donations
router.post('/donations', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { medicines, pickupAddress, pickupDate } = req.body;
    
    // Validate expiry dates
    const today = new Date();
    const minExpiryDate = new Date();
    minExpiryDate.setMonth(today.getMonth() + 3); // At least 3 months remaining
    
    for (const med of medicines) {
      if (new Date(med.expiryDate) < minExpiryDate) {
        ResponseHelper.error(res, `Medicine ${med.name} expires too soon (minimum 3 months required)`, 400);
        return;
      }
    }

    const donation = await MedicineDonation.create({
      donorId: req.userId,
      medicines,
      pickupAddress,
      pickupDate: pickupDate ? new Date(pickupDate) : undefined,
    });

    ResponseHelper.created(res, 'Medicine donation submitted for review', donation);
  } catch (err) { next(err); }
});

// GET /medicines/donations/my
router.get('/donations/my', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const donations = await MedicineDonation.find({ donorId: req.userId }).sort({ createdAt: -1 });
    ResponseHelper.success(res, 'My donations', donations);
  } catch (err) { next(err); }
});

// GET /medicines/donations (admin/ngo)
router.get('/donations', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, status } = req.query as Record<string, string>;
    const pag = getPaginationOptions(page, limit);
    const filter: Record<string, unknown> = { isDeleted: false };
    if (status) filter.status = status;
    const [donations, total] = await Promise.all([
      MedicineDonation.find(filter).skip(pag.skip).limit(pag.limit)
        .populate('donorId', 'fullName mobileNumber email'),
      MedicineDonation.countDocuments(filter),
    ]);
    ResponseHelper.paginated(res, 'Donations fetched', donations, pag.page, pag.limit, total);
  } catch (err) { next(err); }
});

// PATCH /medicines/donations/:id/status — Admin updates donation status lifecycle
// pending → approved → collected → distributed (patient received medicines)
// When status = 'distributed', distributedAt is stamped so donor history shows delivery confirmation
router.patch('/donations/:id/status', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, note } = req.body;
    const validStatuses = Object.values(MedicineDonationStatus);
    if (!validStatuses.includes(status)) {
      ResponseHelper.error(res, `Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
      return;
    }
    const updateData: Record<string, unknown> = { status };
    if (note) updateData.verificationNote = note;
    if (status === MedicineDonationStatus.APPROVED)     { updateData.verifiedBy = req.userId; }
    if (status === MedicineDonationStatus.COLLECTED)    { updateData.collectedAt = new Date(); }
    if (status === MedicineDonationStatus.DISTRIBUTED)  { updateData.distributedAt = new Date(); }

    const donation = await MedicineDonation.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('donorId', 'fullName mobileNumber email');

    if (!donation) {
      ResponseHelper.error(res, 'Donation not found', 404);
      return;
    }
    ResponseHelper.success(res, `Donation status updated to ${status}`, donation);
  } catch (err) { next(err); }
});

export default router;
