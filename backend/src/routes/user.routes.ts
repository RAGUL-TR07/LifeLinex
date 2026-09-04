import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import userRepository from '../repositories/user.repository';
import { ResponseHelper } from '../utils/response';
import { HTTP_STATUS, MESSAGES } from '../constants';
import { getPaginationOptions } from '../utils/helpers';
import { UserRole } from '../constants/enums';
import cloudinary from '../config/cloudinary';
import multer from 'multer';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /users/profile
router.get('/profile', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await userRepository.findById(req.userId!);
    if (!user) {
      if (req.userId === '65f1a2b3c4d5e6f7a8b9c0d1' || req.userId === '65f1a2b3c4d5e6f7a8b9c0d2') {
        const isOrg = req.userRole && req.userRole !== UserRole.PATIENT && req.userRole !== UserRole.ADMIN;
        const demoUser = {
          _id: req.userId,
          fullName: isOrg ? 'DEMO ORGANIZATION FACILITY' : req.userId === '65f1a2b3c4d5e6f7a8b9c0d1' ? 'System Administrator' : 'Demo Patient User',
          email: req.userEmail || (req.userId === '65f1a2b3c4d5e6f7a8b9c0d1' ? 'admin@lifelinex.com' : 'user@lifelinex.com'),
          role: req.userRole || UserRole.PATIENT,
          roles: req.userRole ? [req.userRole] : [UserRole.PATIENT],
          accountType: isOrg ? 'organization' : 'individual',
          isEmailVerified: true,
          verificationStatus: 'approved',
          accountStatus: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        ResponseHelper.success(res, MESSAGES.USER.PROFILE_FETCHED, demoUser);
        return;
      }
      ResponseHelper.error(res, MESSAGES.USER.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
      return;
    }
    ResponseHelper.success(res, MESSAGES.USER.PROFILE_FETCHED, user);
  } catch (err) { next(err); }
});

// PUT /users/profile
router.put('/profile', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const allowedFields = ['fullName', 'mobileNumber', 'address', 'dateOfBirth', 'gender', 'bloodGroup', 'notificationSettings', 'availability', 'roles', 'preferredLanguage'];
    const updates: Record<string, any> = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }
    if (updates.roles && Array.isArray(updates.roles) && updates.roles.length > 0) {
      updates.role = updates.roles[0];
    }
    const user = await userRepository.updateById(req.userId!, updates);
    ResponseHelper.success(res, MESSAGES.USER.PROFILE_UPDATED, user);
  } catch (err) { next(err); }
});

// PUT /users/emergency-contacts
router.put('/emergency-contacts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { emergencyContacts } = req.body;
    const user = await userRepository.updateById(req.userId!, { emergencyContacts });
    ResponseHelper.success(res, 'Emergency contacts updated', user);
  } catch (err) { next(err); }
});

// PUT /users/location
router.put('/location', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { latitude, longitude } = req.body;
    const user = await userRepository.updateById(req.userId!, {
      location: { type: 'Point', coordinates: [longitude, latitude] },
    });
    ResponseHelper.success(res, 'Location updated', user);
  } catch (err) { next(err); }
});

// POST /users/verify
router.post('/verify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { govtDoc, certDoc, city, skills, documents } = req.body;

    // Build verificationDocuments array from submitted data
    const verificationDocuments: Array<{ name: string; url?: string; fileType?: string; submittedAt: Date }> = [];

    // Accept structured documents array if provided (future file upload support)
    if (Array.isArray(documents) && documents.length > 0) {
      documents.forEach((doc: any) => {
        verificationDocuments.push({
          name: doc.name || doc.title || 'Document',
          url: doc.url || undefined,
          fileType: doc.fileType || 'pdf',
          submittedAt: new Date(),
        });
      });
    } else {
      // Fallback: build from individual doc name fields
      if (govtDoc) {
        verificationDocuments.push({
          name: govtDoc,
          fileType: govtDoc.match(/\.(jpg|jpeg|png|webp)$/i) ? 'image' : 'pdf',
          submittedAt: new Date(),
        });
      }
      if (certDoc) {
        verificationDocuments.push({
          name: certDoc,
          fileType: certDoc.match(/\.(jpg|jpeg|png|webp)$/i) ? 'image' : 'pdf',
          submittedAt: new Date(),
        });
      }
    }

    const updatePayload: Record<string, any> = {
      hasUploadedDocs: true,
      verificationStatus: 'pending' as any,
    };
    if (verificationDocuments.length > 0) {
      updatePayload.verificationDocuments = verificationDocuments;
    }
    if (city) updatePayload['address.city'] = city;
    if (skills) updatePayload.volunteerBadges = skills;

    const user = await userRepository.updateById(req.userId!, updatePayload);
    ResponseHelper.success(res, 'Verification documents submitted successfully', user);
  } catch (err) { next(err); }
});

// POST /users/fcm-token
router.post('/fcm-token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;
    await userRepository.addFcmToken(req.userId!, token);
    ResponseHelper.success(res, 'FCM token registered');
  } catch (err) { next(err); }
});

// DELETE /users/account
router.delete('/account', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await userRepository.softDelete(req.userId!);
    ResponseHelper.success(res, MESSAGES.USER.DELETED);
  } catch (err) { next(err); }
});

export default router;
