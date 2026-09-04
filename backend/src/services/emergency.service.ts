import Emergency, { IEmergency } from '../models/Emergency';
import ChatRoom from '../models/ChatRoom';
import { AppError } from '../middlewares/error.middleware';
import { HTTP_STATUS, MESSAGES } from '../constants';
import { EmergencyStatus, EmergencyType, SocketEvents } from '../constants/enums';
import notificationService from './notification.service';
import { getPaginationOptions } from '../utils/helpers';
import { getIO } from '../socket/socket';
import mongoose from 'mongoose';

class EmergencyService {
  async createEmergency(data: {
    patientId: string;
    type: EmergencyType;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    coordinates: [number, number];
    address?: string;
    familyMemberIds?: string[];
  }): Promise<IEmergency> {
    const emergency = await Emergency.create({
      patientId: new mongoose.Types.ObjectId(data.patientId),
      type: data.type,
      description: data.description,
      severity: data.severity,
      location: {
        type: 'Point',
        coordinates: data.coordinates,
        address: data.address,
      },
      familyMembers: data.familyMemberIds?.map((id) => new mongoose.Types.ObjectId(id)) || [],
      timeline: [
        {
          status: EmergencyStatus.CREATED,
          message: 'Emergency reported',
          timestamp: new Date(),
        },
      ],
    });

    // Create a chat room for this emergency
    const chatRoom = await ChatRoom.create({
      emergencyId: emergency._id,
      type: 'emergency',
      name: `Emergency Room - ${emergency._id}`,
      participants: [{ userId: new mongoose.Types.ObjectId(data.patientId), role: 'patient' }],
    });

    await Emergency.findByIdAndUpdate(emergency._id, { chatRoomId: chatRoom._id });

    // Emit socket event
    const io = getIO();
    io.emit(SocketEvents.EMERGENCY_CREATED, { emergency });

    // Notify nearby hospitals
    await notificationService.notifyEmergencyCreated(emergency);

    return emergency;
  }

  async updateEmergency(
    emergencyId: string,
    userId: string,
    data: Partial<{
      status: EmergencyStatus;
      assignedHospitalId: string;
      assignedAmbulanceId: string;
      message: string;
    }>
  ): Promise<IEmergency> {
    const emergency = await Emergency.findById(emergencyId);
    if (!emergency) {
      throw new AppError(MESSAGES.EMERGENCY.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    const update: Record<string, unknown> = {};
    if (data.status) update.status = data.status;
    if (data.assignedHospitalId)
      update.assignedHospitalId = new mongoose.Types.ObjectId(data.assignedHospitalId);
    if (data.assignedAmbulanceId)
      update.assignedAmbulanceId = new mongoose.Types.ObjectId(data.assignedAmbulanceId);

    const timelineEntry = {
      status: data.status || emergency.status,
      message: data.message || `Status updated to ${data.status}`,
      updatedBy: new mongoose.Types.ObjectId(userId),
      timestamp: new Date(),
    };

    const updated = await Emergency.findByIdAndUpdate(
      emergencyId,
      {
        $set: update,
        $push: { timeline: timelineEntry },
      },
      { new: true }
    );

    // Emit socket event
    const io = getIO();
    io.to(`emergency:${emergencyId}`).emit(SocketEvents.EMERGENCY_UPDATED, { emergency: updated });

    return updated!;
  }

  async getEmergencyById(id: string): Promise<IEmergency> {
    const emergency = await Emergency.findById(id)
      .populate('patientId', 'fullName mobileNumber profileImage bloodGroup')
      .populate('assignedHospitalId', 'organizationName address phone')
      .populate('assignedVolunteers', 'fullName mobileNumber profileImage')
      .populate('familyMembers', 'fullName mobileNumber');

    if (!emergency) throw new AppError(MESSAGES.EMERGENCY.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    return emergency;
  }

  async getEmergencies(
    filter: Record<string, unknown>,
    page: number,
    limit: number
  ): Promise<{ emergencies: IEmergency[]; total: number }> {
    const { skip } = getPaginationOptions(page, limit);
    const [emergencies, total] = await Promise.all([
      Emergency.find(filter)
        .populate('patientId', 'fullName profileImage')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Emergency.countDocuments(filter),
    ]);
    return { emergencies, total };
  }

  async assignVolunteer(emergencyId: string, volunteerId: string): Promise<IEmergency> {
    const emergency = await Emergency.findByIdAndUpdate(
      emergencyId,
      {
        $addToSet: { assignedVolunteers: new mongoose.Types.ObjectId(volunteerId) },
        $push: {
          timeline: {
            status: 'volunteer_assigned',
            message: 'Volunteer assigned',
            updatedBy: new mongoose.Types.ObjectId(volunteerId),
            timestamp: new Date(),
          },
        },
      },
      { new: true }
    );
    if (!emergency) throw new AppError(MESSAGES.EMERGENCY.NOT_FOUND, HTTP_STATUS.NOT_FOUND);

    const io = getIO();
    io.to(`emergency:${emergencyId}`).emit(SocketEvents.VOLUNTEER_ASSIGNED, { volunteerId });

    return emergency;
  }

  async cancelEmergency(emergencyId: string, userId: string): Promise<IEmergency> {
    return this.updateEmergency(emergencyId, userId, {
      status: EmergencyStatus.CANCELLED,
      message: 'Emergency cancelled by user',
    });
  }
}

export default new EmergencyService();
