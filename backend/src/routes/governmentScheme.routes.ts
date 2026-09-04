import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { GovernmentScheme, SchemeApplication } from '../models/GovernmentScheme';
import { ResponseHelper } from '../utils/response';
import { getPaginationOptions } from '../utils/helpers';

const router = Router();

// GET /government-schemes
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, category, search } = req.query as Record<string, string>;
    const pag = getPaginationOptions(page, limit);
    const filter: Record<string, unknown> = { isActive: true };
    if (category) filter.category = category;
    if (search) filter.name = new RegExp(search, 'i');
    const [schemes, total] = await Promise.all([
      GovernmentScheme.find(filter).skip(pag.skip).limit(pag.limit),
      GovernmentScheme.countDocuments(filter),
    ]);
    ResponseHelper.paginated(res, 'Government schemes', schemes, pag.page, pag.limit, total);
  } catch (err) { next(err); }
});

// POST /government-schemes/:id/apply
router.post('/:id/apply', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const application = await SchemeApplication.create({
      schemeId: req.params.id as string,
      applicantId: req.userId,
      documents: req.body.documents || [],
    });
    ResponseHelper.created(res, 'Application submitted', application);
  } catch (err) { next(err); }
});

// GET /government-schemes/applications/my
router.get('/applications/my', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const applications = await SchemeApplication.find({ applicantId: req.userId })
      .populate('schemeId').sort({ createdAt: -1 });
    ResponseHelper.success(res, 'My applications', applications);
  } catch (err) { next(err); }
});

export default router;
