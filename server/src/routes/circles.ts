import { Router } from 'express';
import {
  getMyCircles,
  createCircle,
  joinCircle,
  getCircleDetails,
  leaveCircle,
  deleteCircle,
  updateCirclePassword,
  removeCircleMember,
  shareCircleMaterial,
  removeCircleMaterial,
  createAnnouncement,
  deleteAnnouncement,
} from '../controllers/circles.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, getMyCircles);
router.post('/', authenticate, createCircle);
router.post('/join', authenticate, joinCircle);
router.get('/:id', authenticate, getCircleDetails);
router.post('/:id/leave', authenticate, leaveCircle);
router.delete('/:id', authenticate, deleteCircle);
router.put('/:id/password', authenticate, updateCirclePassword);
router.delete('/:id/members/:userId', authenticate, removeCircleMember);
router.post('/:id/materials', authenticate, shareCircleMaterial);
router.delete('/:id/materials/:materialId', authenticate, removeCircleMaterial);
router.post('/:id/announcements', authenticate, createAnnouncement);
router.delete('/:id/announcements/:announcementId', authenticate, deleteAnnouncement);

export default router;
