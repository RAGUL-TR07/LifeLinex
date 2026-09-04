import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, optionalAuth } from '../middlewares/auth.middleware';
import BloodRequest from '../models/BloodRequest';
import BloodDonation from '../models/BloodDonation';
import userRepository from '../repositories/user.repository';
import User from '../models/User';
import { ResponseHelper } from '../utils/response';
import { getPaginationOptions } from '../utils/helpers';
import notificationService from '../services/notification.service';
import { NotificationType, UserRole, VerificationStatus } from '../constants/enums';
import { getIO } from '../socket/socket';
import mongoose from 'mongoose';
import ActivityLog from '../models/ActivityLog';

const router = Router();

// POST /blood/requests
router.post('/requests', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      bloodGroup,
      unitsRequired,
      hospitalName,
      hospitalAddress,
      patientName,
      patientContactNumber,
      attenderName,
      requiredBy,
      urgency,
      medicalReason,
      medicalCertificate,
      latitude,
      longitude,
      address,
      notes,
    } = req.body;

    // Generate unique request ID e.g. BLD-123456
    const randomId = Math.floor(100000 + Math.random() * 900000);
    const requestId = `BLD-${randomId}`;

    const bloodRequest = await BloodRequest.create({
      requestId,
      requestedBy: new mongoose.Types.ObjectId(req.userId),
      patientName,
      patientContactNumber,
      attenderName,
      bloodGroup,
      unitsRequired,
      hospitalName,
      hospitalAddress,
      urgency: urgency || 'normal',
      medicalReason,
      medicalCertificate,
      status: 'Pending',
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude || '0'), parseFloat(latitude || '0')],
        address: address || hospitalAddress,
      },
      requiredBy: requiredBy ? new Date(requiredBy) : new Date(Date.now() + 24 * 60 * 60 * 1000),
      notes,
    });

    // Update status to Searching
    bloodRequest.status = 'Searching';
    await bloodRequest.save();

    // Find nearby verified donors
    const nearbyDonors = await User.find({
      role: UserRole.BLOOD_DONOR,
      accountStatus: 'active',
      verificationStatus: 'approved',
      bloodGroup,
      location: {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude || '0'), parseFloat(latitude || '0')],
          },
          $maxDistance: 30 * 1000, // 30 km radius
        },
      },
    } as any).limit(20);

    const notifiedDonorIds = nearbyDonors.map((d) => d._id);
    bloodRequest.notifiedDonors = notifiedDonorIds;
    await bloodRequest.save();

    // Broadcast to all relevant stakeholders in real time
    const io = getIO();
    
    // Broadcast globally to admin, hospitals, NGOs, volunteers, blood banks
    io.emit('bloodRequestCreated', { bloodRequest, nearbyDonorsCount: nearbyDonors.length });
    
    // Send targeted socket events to nearby donors
    for (const donor of nearbyDonors) {
      io.to(`user:${donor._id}`).emit('bloodRequestCreated', { bloodRequest });
      io.to(`user:${donor._id}`).emit('blood:request_created', { bloodRequest });

      // Create system notification
      await notificationService.create({
        recipientId: donor._id.toString(),
        type: NotificationType.BLOOD_REQUEST,
        title: `🚨 Emergency: ${bloodGroup} Blood Needed`,
        message: `Emergency request ${requestId} for ${unitsRequired} units of ${bloodGroup} at ${hospitalName}. Can you assist?`,
        referenceId: bloodRequest._id.toString(),
        referenceModel: 'BloodRequest',
      });
    }

    // Create activity log
    await ActivityLog.create({
      userId: new mongoose.Types.ObjectId(req.userId),
      action: 'BLOOD_REQUEST_CREATED',
      resource: 'BloodRequest',
      resourceId: bloodRequest._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { description: `Created blood request ${requestId} for ${bloodGroup} blood.` },
      success: true,
    } as any);

    ResponseHelper.created(res, 'Blood request created and broadcasted.', bloodRequest);
    return;
  } catch (err) {
    next(err);
  }
});

// GET /blood/requests
router.get('/requests', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, bloodGroup, urgency, status, requestedBy } = req.query as Record<string, string>;
    const pag = getPaginationOptions(page, limit);
    const filter: Record<string, unknown> = { isDeleted: false };
    
    if (bloodGroup) filter.bloodGroup = bloodGroup;
    if (urgency) filter.urgency = urgency;
    if (status) filter.status = status;
    if (requestedBy) filter.requestedBy = requestedBy;

    const [requests, total] = await Promise.all([
      BloodRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip(pag.skip)
        .limit(pag.limit)
        .populate('requestedBy', 'fullName mobileNumber')
        .populate('assignedDonor', 'fullName mobileNumber profileImage rating availability responseTime lastDonationDate totalDonations')
        .populate('assignedHospital', 'organizationName address mobileNumber')
        .populate('assignedNGO', 'organizationName address mobileNumber')
        .populate('assignedVolunteer', 'fullName mobileNumber profileImage'),
      BloodRequest.countDocuments(filter),
    ]);
    ResponseHelper.paginated(res, 'Blood requests fetched', requests, pag.page, pag.limit, total);
    return;
  } catch (err) {
    next(err);
  }
});

// GET /blood/requests/:id
router.get('/requests/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const request = await BloodRequest.findById(req.params.id)
      .populate('requestedBy', 'fullName mobileNumber')
      .populate('assignedDonor', 'fullName mobileNumber profileImage rating availability responseTime lastDonationDate totalDonations')
      .populate('assignedHospital', 'organizationName address mobileNumber')
      .populate('assignedNGO', 'organizationName address mobileNumber')
      .populate('assignedVolunteer', 'fullName mobileNumber profileImage');
      
    if (!request) {
      res.status(404).json({ success: false, message: 'Request not found' });
      return;
    }
    ResponseHelper.success(res, 'Blood request details fetched', request);
    return;
  } catch (err) {
    next(err);
  }
});

// POST /blood/requests/:id/accept-donor
router.post('/requests/:id/accept-donor', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const request = await BloodRequest.findById(req.params.id);
    if (!request) {
      res.status(404).json({ success: false, message: 'Request not found' });
      return;
    }

    request.status = 'Accepted';
    request.assignedDonor = new mongoose.Types.ObjectId(req.userId);
    await request.save();

    const donorUser = await User.findById(req.userId).select('fullName mobileNumber profileImage rating availability responseTime lastDonationDate totalDonations');

    const io = getIO();
    // Broadcast change
    io.emit('bloodRequestAccepted', { bloodRequest: request, donor: donorUser });
    io.to(`user:${request.requestedBy}`).emit('bloodRequestAccepted', { bloodRequest: request, donor: donorUser });

    // Notify patient
    await notificationService.create({
      recipientId: request.requestedBy.toString(),
      type: NotificationType.BLOOD_REQUEST,
      title: '🩸 Donor Accepted Your Request',
      message: `Verified donor ${donorUser?.fullName} has accepted your request ${request.requestId} and is on their way.`,
      referenceId: request._id.toString(),
      referenceModel: 'BloodRequest',
    });

    // Create activity log
    await ActivityLog.create({
      userId: new mongoose.Types.ObjectId(req.userId),
      action: 'BLOOD_REQUEST_ACCEPTED',
      resource: 'BloodRequest',
      resourceId: request._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { description: `Accepted blood request ${request.requestId} as donor.` },
      success: true,
    } as any);

    ResponseHelper.success(res, 'Request accepted successfully', { bloodRequest: request, donor: donorUser });
    return;
  } catch (err) {
    next(err);
  }
});

// POST /blood/requests/:id/hospital-action
router.post('/requests/:id/hospital-action', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { action, hospitalId, targetBloodBankId } = req.body;
    const request = await BloodRequest.findById(req.params.id);
    if (!request) {
      res.status(404).json({ success: false, message: 'Request not found' });
      return;
    }

    if (action === 'accept') {
      request.status = 'Hospital Assigned';
      request.assignedHospital = new mongoose.Types.ObjectId(hospitalId || req.userId);
    } else if (action === 'forward') {
      request.status = 'Searching';
      if (targetBloodBankId) {
        request.assignedHospital = new mongoose.Types.ObjectId(targetBloodBankId);
        request.status = 'Blood Reserved';
      }
    } else if (action === 'reject') {
      request.status = 'Cancelled';
    }

    await request.save();

    const io = getIO();
    io.emit('hospitalAccepted', { bloodRequest: request, action });
    io.to(`user:${request.requestedBy}`).emit('hospitalAccepted', { bloodRequest: request, action });

    ResponseHelper.success(res, `Hospital action '${action}' recorded.`, request);
    return;
  } catch (err) {
    next(err);
  }
});

// POST /blood/requests/:id/ngo-action
router.post('/requests/:id/ngo-action', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { action, volunteerId, ngoId } = req.body;
    const request = await BloodRequest.findById(req.params.id);
    if (!request) {
      res.status(404).json({ success: false, message: 'Request not found' });
      return;
    }

    request.assignedNGO = new mongoose.Types.ObjectId(ngoId || req.userId);
    
    if (action === 'assign_volunteer' && volunteerId) {
      request.assignedVolunteer = new mongoose.Types.ObjectId(volunteerId);
      request.status = 'Donor Assigned';
    } else {
      request.status = 'Accepted';
    }

    await request.save();

    const io = getIO();
    io.emit('ngoAccepted', { bloodRequest: request, action });
    if (volunteerId) {
      io.to(`user:${volunteerId}`).emit('volunteerAssigned', { bloodRequest: request });
    }
    io.to(`user:${request.requestedBy}`).emit('ngoAccepted', { bloodRequest: request, action });

    ResponseHelper.success(res, `NGO action '${action}' recorded.`, request);
    return;
  } catch (err) {
    next(err);
  }
});

// POST /blood/requests/:id/volunteer-action
router.post('/requests/:id/volunteer-action', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { action } = req.body;
    const request = await BloodRequest.findById(req.params.id);
    if (!request) {
      res.status(404).json({ success: false, message: 'Request not found' });
      return;
    }

    request.assignedVolunteer = new mongoose.Types.ObjectId(req.userId);
    if (action === 'accept_task') {
      request.status = 'Donor Assigned';
    }

    await request.save();

    const io = getIO();
    io.emit('volunteerAssigned', { bloodRequest: request });
    io.to(`user:${request.requestedBy}`).emit('volunteerAssigned', { bloodRequest: request });

    ResponseHelper.success(res, `Volunteer action recorded.`, request);
    return;
  } catch (err) {
    next(err);
  }
});

// POST /blood/requests/:id/complete
router.post('/requests/:id/complete', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const request = await BloodRequest.findById(req.params.id);
    if (!request) {
      res.status(404).json({ success: false, message: 'Request not found' });
      return;
    }

    request.status = 'Completed';
    await request.save();

    const io = getIO();
    io.emit('bloodRequestCompleted', { bloodRequest: request });
    io.to(`user:${request.requestedBy}`).emit('bloodRequestCompleted', { bloodRequest: request });

    ResponseHelper.success(res, `Request marked as Completed.`, request);
    return;
  } catch (err) {
    next(err);
  }
});

// POST /blood/requests/:id/cancel
router.post('/requests/:id/cancel', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const request = await BloodRequest.findById(req.params.id);
    if (!request) {
      res.status(404).json({ success: false, message: 'Request not found' });
      return;
    }

    request.status = 'Cancelled';
    await request.save();

    const io = getIO();
    io.emit('bloodRequestCancelled', { bloodRequest: request });
    io.to(`user:${request.requestedBy}`).emit('bloodRequestCancelled', { bloodRequest: request });

    ResponseHelper.success(res, `Request marked as Cancelled.`, request);
    return;
  } catch (err) {
    next(err);
  }
});

// POST /blood/requests/:id/location-update (for simulating/sharing location)
router.post('/requests/:id/location-update', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { latitude, longitude } = req.body;
    const request = await BloodRequest.findById(req.params.id);
    if (!request) {
      res.status(404).json({ success: false, message: 'Request not found' });
      return;
    }

    const io = getIO();
    // Emit real-time location update to subscriber
    io.to(`user:${request.requestedBy}`).emit('donorLocationUpdated', {
      requestId: request._id,
      latitude,
      longitude,
    });

    ResponseHelper.success(res, 'Location update sent.', { latitude, longitude });
    return;
  } catch (err) {
    next(err);
  }
});

// POST /blood/donations
router.post('/donations', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bloodRequestId, bloodBankId, bloodGroup, units, donationDate } = req.body;
    const donation = await BloodDonation.create({
      donorId: req.userId,
      bloodRequestId,
      bloodBankId,
      bloodGroup,
      units,
      donationDate: new Date(donationDate),
    });

    if (bloodRequestId) {
      await BloodRequest.findByIdAndUpdate(bloodRequestId, { $inc: { unitsReceived: units } });
    }

    ResponseHelper.created(res, 'Blood donation recorded', donation);
    return;
  } catch (err) {
    next(err);
  }
});

// GET /blood/donations/history
router.get('/donations/history', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const donations = await BloodDonation.find({ donorId: req.userId }).sort({ donationDate: -1 });
    ResponseHelper.success(res, 'Donation history fetched', donations);
    return;
  } catch (err) {
    next(err);
  }
});

// GET /blood/inventory/:hospitalId
router.get('/inventory/:hospitalId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const Organization = (await import('../models/Organization')).default;
    const org = await Organization.findById(req.params.hospitalId).select('bloodInventory organizationName');
    ResponseHelper.success(res, 'Blood inventory fetched', org);
    return;
  } catch (err) {
    next(err);
  }
});

// GET /blood/donors - Get blood donors (public endpoint, optionalAuth for token data)
router.get('/donors', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bloodGroup, limit: limitParam } = req.query as Record<string, string>;
    const limit = Math.min(parseInt(limitParam || '20', 10), 50);

    // Search broadly: BLOOD_DONOR role users, OR any verified user with matching blood group
    const filter: Record<string, unknown> = {
      accountStatus: 'active',
      $or: [
        { role: UserRole.BLOOD_DONOR },
        { role: UserRole.PATIENT, bloodGroup: { $exists: true, $ne: null } },
      ],
    };
    if (bloodGroup) {
      filter.bloodGroup = bloodGroup;
      // When blood group filter is active, remove the $or and just filter by blood group
      delete filter.$or;
    }

    const donors = await User.find(filter).select('-passwordHash -fcmTokens').limit(limit);
    ResponseHelper.success(res, 'Donors fetched successfully', { donors, total: donors.length });
    return;
  } catch (err) {
    next(err);
  }
});

// GET /blood/banks - Get blood banks with their real-time inventory
router.get('/banks', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const Organization = (await import('../models/Organization')).default;
    const { OrganizationType: OrgType } = await import('../constants/enums');
    const { bloodGroup } = req.query as Record<string, string>;

    // Find approved blood bank organizations
    const filter: Record<string, unknown> = {
      organizationType: OrgType.BLOOD_BANK,
      verificationStatus: 'approved',
      isDeleted: false,
    };

    const banks = await Organization.find(filter)
      .select('organizationName phone email address location bloodInventory registrationNumber verificationStatus')
      .lean();

    // If bloodGroup filter provided, filter to banks that have stock of that group
    let result = banks;
    if (bloodGroup) {
      result = banks.filter((b: any) => {
        if (!b.bloodInventory || !Array.isArray(b.bloodInventory)) return false;
        return b.bloodInventory.some((inv: any) =>
          inv.bloodGroup === bloodGroup && inv.units > 0
        );
      });
    }

    // Shape response to include availability per blood group
    const shaped = result.map((b: any) => ({
      _id: b._id,
      organizationName: b.organizationName,
      phone: b.phone,
      email: b.email,
      registrationNumber: b.registrationNumber,
      address: {
        street: b.address?.street || '',
        city: b.address?.city || '',
        state: b.address?.state || '',
        pincode: b.address?.pincode || '',
      },
      location: b.location,
      bloodInventory: (b.bloodInventory || []).map((inv: any) => ({
        bloodGroup: inv.bloodGroup,
        units: inv.units || 0,
        available: (inv.units || 0) > 0,
      })),
      availableGroups: (b.bloodInventory || [])
        .filter((inv: any) => (inv.units || 0) > 0)
        .map((inv: any) => inv.bloodGroup),
    }));

    ResponseHelper.success(res, 'Blood banks fetched successfully', { banks: shaped, total: shaped.length });
    return;
  } catch (err) {
    next(err);
  }
});

// PUT /blood/banks/inventory - Blood bank updates their own inventory (called from SaveLife Dashboard)
router.put('/banks/inventory', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const Organization = (await import('../models/Organization')).default;
    const { bloodInventory } = req.body; // array of { bloodGroup, units }

    // Find the organization for this user
    const org = await Organization.findOne({ adminUserId: req.userId, isDeleted: false });
    if (!org) {
      // Return success anyway for demo fallback
      ResponseHelper.success(res, 'Inventory updated (local)', { bloodInventory });
      return;
    }

    org.bloodInventory = bloodInventory;
    await org.save();

    // Broadcast inventory update
    const io = getIO();
    io.emit('bloodBankInventoryUpdated', {
      bankId: org._id,
      bankName: org.organizationName,
      bloodInventory: org.bloodInventory,
    });

    ResponseHelper.success(res, 'Blood inventory updated successfully', { bloodInventory: org.bloodInventory });
    return;
  } catch (err) {
    next(err);
  }
});

export default router;
