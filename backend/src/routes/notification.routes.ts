import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import notificationService from '../services/notification.service';
import { ResponseHelper } from '../utils/response';

const router = Router();

router.use(authenticate);

// GET /notifications
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '20' } = req.query as Record<string, string>;
    const result = await notificationService.getNotifications(req.userId!, parseInt(page), parseInt(limit));
    ResponseHelper.success(res, 'Notifications fetched', result);
  } catch (err) { next(err); }
});

// GET /notifications/unread-count
router.get('/unread-count', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await notificationService.getUnreadCount(req.userId!);
    ResponseHelper.success(res, 'Unread count', { count });
  } catch (err) { next(err); }
});

// PATCH /notifications/:id/read
router.patch('/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await notificationService.markAsRead(req.params.id as string, req.userId!);
    ResponseHelper.success(res, 'Notification marked as read');
  } catch (err) { next(err); }
});

// PATCH /notifications/read-all
router.patch('/read-all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await notificationService.markAllAsRead(req.userId!);
    ResponseHelper.success(res, 'All notifications marked as read');
  } catch (err) { next(err); }
});

export default router;
