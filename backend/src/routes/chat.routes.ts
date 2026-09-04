import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import ChatRoom from '../models/ChatRoom';
import Message from '../models/Message';
import { ResponseHelper } from '../utils/response';
import { getPaginationOptions } from '../utils/helpers';
import mongoose from 'mongoose';

const router = Router();
router.use(authenticate);

// GET /chat/rooms - Get user's chat rooms
router.get('/rooms', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rooms = await ChatRoom.find({
      'participants.userId': new mongoose.Types.ObjectId(req.userId!),
      isActive: true,
    })
      .populate('lastMessage')
      .sort({ lastMessageAt: -1 });
    ResponseHelper.success(res, 'Chat rooms fetched', rooms);
  } catch (err) { next(err); }
});

// GET /chat/rooms/:roomId/messages
router.get('/rooms/:roomId/messages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = req.query as Record<string, string>;
    const pag = getPaginationOptions(page, limit);
    const room = await ChatRoom.findOne({
      _id: new mongoose.Types.ObjectId(req.params.roomId as string),
      'participants.userId': new mongoose.Types.ObjectId(req.userId! as string),
    });
    if (!room) { ResponseHelper.error(res, 'Chat room not found', 404); return; }

    const [messages, total] = await Promise.all([
      Message.find({ chatRoomId: req.params.roomId, isDeleted: false })
        .sort({ createdAt: -1 })
        .skip(pag.skip)
        .limit(pag.limit)
        .populate('senderId', 'fullName profileImage'),
      Message.countDocuments({ chatRoomId: req.params.roomId, isDeleted: false }),
    ]);
    ResponseHelper.paginated(res, 'Messages fetched', messages.reverse(), pag.page, pag.limit, total);
  } catch (err) { next(err); }
});

// POST /chat/rooms - Create direct/group chat room
router.post('/rooms', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { participantIds, type = 'group', name } = req.body;
    const allParticipants = [...new Set([req.userId!, ...participantIds])];
    const room = await ChatRoom.create({
      type,
      name,
      participants: allParticipants.map((id: string) => ({ userId: id, role: 'member' })),
    });
    ResponseHelper.created(res, 'Chat room created', room);
  } catch (err) { next(err); }
});

// DELETE /chat/messages/:messageId
router.delete('/messages/:messageId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await Message.findOneAndUpdate(
      { _id: req.params.messageId, senderId: req.userId! },
      { isDeleted: true, deletedAt: new Date(), content: 'This message was deleted' }
    );
    ResponseHelper.success(res, 'Message deleted');
  } catch (err) { next(err); }
});

export default router;
