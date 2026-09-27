import { Router } from 'express';
import {
  getMaterials,
  searchMaterials,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  downloadMaterial,
  previewMaterial,
  saveMaterial,
  unsaveMaterial,
  rateMaterial,
  reportMaterial,
  getAiSummary,
  askAiQuestion,
} from '../controllers/materials.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { uploadMiddleware } from '../middleware/upload.js';

const router = Router();

router.get('/', optionalAuth, getMaterials);
router.get('/search', optionalAuth, searchMaterials);
router.get('/:id', optionalAuth, getMaterialById);
router.post('/', authenticate, uploadMiddleware.single('file'), createMaterial);
router.put('/:id', authenticate, updateMaterial);
router.delete('/:id', authenticate, deleteMaterial);

router.get('/:id/download', optionalAuth, downloadMaterial);
router.get('/:id/preview', optionalAuth, previewMaterial);

router.post('/:id/save', authenticate, saveMaterial);
router.delete('/:id/save', authenticate, unsaveMaterial);

router.post('/:id/rate', authenticate, rateMaterial);
router.post('/:id/report', authenticate, reportMaterial);

router.post('/:id/ai-summary', optionalAuth, getAiSummary);
router.post('/:id/ai-ask', optionalAuth, askAiQuestion);

export default router;
