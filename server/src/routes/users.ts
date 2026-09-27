import { Router } from 'express';
import {
  getSavedMaterials,
  getDownloadHistory,
  getMyUploads,
  updateProfile,
  changePassword,
} from '../controllers/users.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/saved', authenticate, getSavedMaterials);
router.get('/downloads', authenticate, getDownloadHistory);
router.get('/uploads', authenticate, getMyUploads);
router.put('/profile', authenticate, updateProfile);
router.put('/password', authenticate, changePassword);

export default router;
