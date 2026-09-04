import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import Ambulance from '../models/Ambulance';
import AmbulanceBooking from '../models/AmbulanceBooking';
import { ResponseHelper } from '../utils/response';
import { getPaginationOptions } from '../utils/helpers';
import { AmbulanceStatus } from '../constants/enums';
import { getIO } from '../socket/socket';
import { SocketEvents } from '../constants/enums';
import mongoose from 'mongoose';

const router = Router();

// GET /ambulances/available - Find available ambulances near a location
router.get('/available', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { latitude, longitude, maxDistance = '20' } = req.query as Record<string, string>;
    const ambulances = await Ambulance.find({
      isAvailable: true,
      status: AmbulanceStatus.AVAILABLE,
      currentLocation: {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
          $maxDistance: parseFloat(maxDistance) * 1000,
        },
      },
    }).populate('providerId', 'organizationName phone').limit(10);
    ResponseHelper.success(res, 'Available ambulances', ambulances);
  } catch (err) { next(err); }
});

// POST /ambulances/book
router.post('/book', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ambulanceId, pickupLatitude, pickupLongitude, pickupAddress, dropLatitude, dropLongitude, dropAddress, emergencyId } = req.body;

    const ambulance = await Ambulance.findById(ambulanceId);
    if (!ambulance || !ambulance.isAvailable) {
      ResponseHelper.error(res, 'Ambulance not available', 400); return;
    }

    const booking = await AmbulanceBooking.create({
      patientId: req.userId,
      ambulanceId,
      emergencyId,
      pickupLocation: { type: 'Point', coordinates: [parseFloat(pickupLongitude), parseFloat(pickupLatitude)], address: pickupAddress },
      dropLocation: dropLatitude ? { type: 'Point', coordinates: [parseFloat(dropLongitude), parseFloat(dropLatitude)], address: dropAddress } : undefined,
    });

    await Ambulance.findByIdAndUpdate(ambulanceId, { isAvailable: false, status: AmbulanceStatus.ASSIGNED });

    const io = getIO();
    io.to(`ambulance:${ambulanceId}`).emit(SocketEvents.AMBULANCE_ASSIGNED, { booking });

    ResponseHelper.created(res, 'Ambulance booked', booking);
  } catch (err) { next(err); }
});

// PUT /ambulances/bookings/:id/status
router.put('/bookings/:id/status', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, eta } = req.body;
    const booking = await AmbulanceBooking.findByIdAndUpdate(
      req.params.id,
      { $set: { status, ...(eta && { eta }), ...(['arrived'].includes(status) && { arrivedAt: new Date() }), ...(['completed'].includes(status) && { completedAt: new Date() }) } },
      { new: true }
    );

    if (status === 'completed' && booking) {
      await Ambulance.findByIdAndUpdate(booking.ambulanceId, { isAvailable: true, status: AmbulanceStatus.AVAILABLE });
    }

    const io = getIO();
    io.to(`booking:${req.params.id}`).emit(SocketEvents.AMBULANCE_ETA_UPDATE, { booking, eta });

    ResponseHelper.success(res, 'Booking updated', booking);
  } catch (err) { next(err); }
});

// GET /ambulances/bookings/my
router.get('/bookings/my', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bookings = await AmbulanceBooking.find({ patientId: req.userId })
      .sort({ createdAt: -1 })
      .populate('ambulanceId', 'vehicleNumber vehicleType')
      .populate('ambulanceId', 'providerId');
    ResponseHelper.success(res, 'My bookings', bookings);
  } catch (err) { next(err); }
});

// POST /ambulances/:id/rate
router.post('/bookings/:id/rate', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rating, review } = req.body;
    const booking = await AmbulanceBooking.findByIdAndUpdate(
      req.params.id,
      { $set: { rating, review } },
      { new: true }
    );
    ResponseHelper.success(res, 'Rating submitted', booking);
  } catch (err) { next(err); }
});

export default router;
