import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { verifyAccessToken } from '../utils/jwt';
import { SocketEvents } from '../constants/enums';
import logger from '../utils/logger';
import ChatRoom from '../models/ChatRoom';
import Message from '../models/Message';
import mongoose from 'mongoose';

let io: SocketIOServer;

export const initializeSocket = (httpServer: HttpServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Auth middleware
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const decoded = verifyAccessToken(token);
      (socket as Socket & { userId: string; userRole: string }).userId = decoded.userId;
      (socket as Socket & { userId: string; userRole: string }).userRole = decoded.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as Socket & { userId: string }).userId;
    logger.info(`Socket connected: ${socket.id} (User: ${userId})`);

    // Join personal room
    socket.join(`user:${userId}`);

    // Broadcast online status
    socket.broadcast.emit(SocketEvents.USER_ONLINE, { userId });

    // ── Join Room ────────────────────────────────────────────────────────────
    socket.on(SocketEvents.JOIN_ROOM, async (data: { roomId: string }) => {
      const room = await ChatRoom.findOne({
        _id: new mongoose.Types.ObjectId(data.roomId),
        'participants.userId': new mongoose.Types.ObjectId(userId),
      });
      if (room) {
        socket.join(`room:${data.roomId}`);
        logger.debug(`User ${userId} joined room ${data.roomId}`);
      }
    });

    // ── Leave Room ───────────────────────────────────────────────────────────
    socket.on(SocketEvents.LEAVE_ROOM, (data: { roomId: string }) => {
      socket.leave(`room:${data.roomId}`);
    });

    // ── Chat Message ─────────────────────────────────────────────────────────
    socket.on(
      SocketEvents.CHAT_MESSAGE,
      async (data: {
        chatRoomId: string;
        content: string;
        type?: string;
        mediaUrl?: string;
        replyTo?: string;
      }) => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const message = await Message.create({
            chatRoomId: new mongoose.Types.ObjectId(data.chatRoomId),
            senderId: new mongoose.Types.ObjectId(userId),
            content: data.content,
            type: (data.type || 'text') as 'text' | 'image' | 'file' | 'audio' | 'video' | 'location' | 'system',
            mediaUrl: data.mediaUrl,
            replyTo: data.replyTo ? new mongoose.Types.ObjectId(data.replyTo) : undefined,
          } as any);

          await ChatRoom.findByIdAndUpdate(data.chatRoomId, {
            lastMessage: message._id,
            lastMessageAt: new Date(),
          });

          const populatedMessage = await message.populate('senderId', 'fullName profileImage');

          io.to(`room:${data.chatRoomId}`).emit(SocketEvents.CHAT_MESSAGE, populatedMessage);
        } catch (err) {
          logger.error(`Failed to send message: ${err}`);
        }
      }
    );

    // ── Typing ───────────────────────────────────────────────────────────────
    socket.on(SocketEvents.CHAT_TYPING, (data: { chatRoomId: string }) => {
      socket.to(`room:${data.chatRoomId}`).emit(SocketEvents.CHAT_TYPING, { userId });
    });

    socket.on(SocketEvents.CHAT_STOP_TYPING, (data: { chatRoomId: string }) => {
      socket.to(`room:${data.chatRoomId}`).emit(SocketEvents.CHAT_STOP_TYPING, { userId });
    });

    // ── Read Receipt ─────────────────────────────────────────────────────────
    socket.on(
      SocketEvents.CHAT_READ,
      async (data: { messageId: string; chatRoomId: string }) => {
        await Message.findByIdAndUpdate(data.messageId, {
          $addToSet: {
            readBy: { userId: new mongoose.Types.ObjectId(userId), readAt: new Date() },
          },
        });
        socket.to(`room:${data.chatRoomId}`).emit(SocketEvents.CHAT_READ, {
          messageId: data.messageId,
          userId,
        });
      }
    );

    // ── Ambulance Location Update ─────────────────────────────────────────────
    socket.on(
      SocketEvents.AMBULANCE_LOCATION_UPDATE,
      async (data: { ambulanceId: string; coordinates: [number, number]; bookingId: string }) => {
        const Ambulance = (await import('../models/Ambulance')).default;
        await Ambulance.findByIdAndUpdate(data.ambulanceId, {
          'currentLocation.coordinates': data.coordinates,
        });
        io.to(`booking:${data.bookingId}`).emit(SocketEvents.AMBULANCE_LOCATION_UPDATE, {
          coordinates: data.coordinates,
          ambulanceId: data.ambulanceId,
        });
      }
    );

    // ── Disconnect ───────────────────────────────────────────────────────────
    socket.on(SocketEvents.DISCONNECT, () => {
      logger.info(`Socket disconnected: ${socket.id} (User: ${userId})`);
      socket.broadcast.emit(SocketEvents.USER_OFFLINE, { userId });
    });
  });

  logger.info('Socket.io initialized');
  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};
