import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import MedicalRecord from '../models/MedicalRecord';
import { ResponseHelper } from '../utils/response';
import { getPaginationOptions } from '../utils/helpers';
import multer from 'multer';
import mongoose from 'mongoose';

const router = Router();
router.use(authenticate);

// GET /medical-records
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, type, patientId } = req.query as Record<string, string>;
    const pag = getPaginationOptions(page, limit);
    const filter: Record<string, unknown> = { isDeleted: false };
    // Patients see own records; family can see shared; hospital can see patient records
    filter.patientId = patientId ? new mongoose.Types.ObjectId(patientId) : new mongoose.Types.ObjectId(req.userId!);
    if (type) filter.type = type;

    const [records, total] = await Promise.all([
      MedicalRecord.find(filter).sort({ recordDate: -1 }).skip(pag.skip).limit(pag.limit),
      MedicalRecord.countDocuments(filter),
    ]);
    ResponseHelper.paginated(res, 'Medical records fetched', records, pag.page, pag.limit, total);
  } catch (err) { next(err); }
});

// POST /medical-records
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { patientId, type, title, description, fileUrl, fileName, fileSize, mimeType, hospitalId, recordDate, tags } = req.body;
    const record = await MedicalRecord.create({
      patientId: patientId || req.userId,
      uploadedBy: req.userId,
      type, title, description, fileUrl, fileName, fileSize, mimeType, hospitalId,
      recordDate: new Date(recordDate),
      tags: tags || [],
    });
    ResponseHelper.created(res, 'Medical record created', record);
  } catch (err) { next(err); }
});

// DELETE /medical-records/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await MedicalRecord.findOneAndUpdate(
      { _id: req.params.id, $or: [{ patientId: req.userId }, { uploadedBy: req.userId }] },
      { isDeleted: true, deletedAt: new Date() }
    );
    ResponseHelper.success(res, 'Medical record deleted');
  } catch (err) { next(err); }
});

// PUT /medical-records/:id/share
router.put('/:id/share', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { familyMemberIds, isSharedWithFamily } = req.body;
    const record = await MedicalRecord.findByIdAndUpdate(
      req.params.id,
      { $set: { isSharedWithFamily, familyAccessList: familyMemberIds } },
      { new: true }
    );
    ResponseHelper.success(res, 'Sharing settings updated', record);
  } catch (err) { next(err); }
});

export default router;
