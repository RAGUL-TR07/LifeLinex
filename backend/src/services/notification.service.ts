import Notification, { INotification } from '../models/Notification';
import { NotificationType } from '../constants/enums';
import { IEmergency } from '../models/Emergency';
import Organization from '../models/Organization';
import { getIO } from '../socket/socket';
import { SocketEvents } from '../constants/enums';
import logger from '../utils/logger';
import mongoose from 'mongoose';

class NotificationService {
  async create(data: {
    recipientId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, unknown>;
    referenceId?: string;
    referenceModel?: string;
    channels?: ('in_app' | 'push' | 'email' | 'sms')[];
  }): Promise<INotification> {
    const notification = await Notification.create({
      recipientId: new mongoose.Types.ObjectId(data.recipientId),
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data,
      referenceId: data.referenceId ? new mongoose.Types.ObjectId(data.referenceId) : undefined,
      referenceModel: data.referenceModel,
      channels: data.channels || ['in_app'],
    });

    // Push via socket
    const io = getIO();
    io.to(`user:${data.recipientId}`).emit(SocketEvents.NOTIFICATION, notification);

    return notification;
  }

  async notifyEmergencyCreated(emergency: IEmergency): Promise<void> {
    try {
      // Find nearby hospitals
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nearbyHospitals = await (Organization.find as any)({
        organizationType: 'hospital',
        location: {
          $nearSphere: {
            $geometry: { type: 'Point', coordinates: emergency.location.coordinates },
            $maxDistance: 20000, // 20km
          },
        },
      }).limit(5);

      const io = getIO();
      for (const hospital of nearbyHospitals) {
        io.to(`org:${hospital._id}`).emit(SocketEvents.EMERGENCY_CREATED, {
          emergency,
          hospital: hospital._id,
        });

        await this.create({
          recipientId: hospital.adminUserId.toString(),
          type: NotificationType.EMERGENCY_CREATED,
          title: 'New Emergency Nearby',
          message: `A ${emergency.severity} emergency has been reported near your hospital.`,
          referenceId: emergency._id.toString(),
          referenceModel: 'Emergency',
        });
      }
    } catch (err) {
      logger.error(`Failed to notify hospitals of emergency: ${err}`);
    }
  }

  async getNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ notifications: INotification[]; total: number; unread: number }> {
    const skip = (page - 1) * limit;
    const filter = { recipientId: new mongoose.Types.ObjectId(userId) };

    const [notifications, total, unread] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments(filter),
      Notification.countDocuments({ ...filter, isRead: false }),
    ]);

    return { notifications, total, unread };
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await Notification.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(notificationId),
        recipientId: new mongoose.Types.ObjectId(userId),
      },
      { $set: { isRead: true, readAt: new Date() } }
    );
  }

  async markAllAsRead(userId: string): Promise<void> {
    await Notification.updateMany(
      { recipientId: new mongoose.Types.ObjectId(userId), isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    return Notification.countDocuments({
      recipientId: new mongoose.Types.ObjectId(userId),
      isRead: false,
    });
  }
}

export default new NotificationService();
