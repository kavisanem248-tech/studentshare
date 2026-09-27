import { Router } from 'express';
import {
  getStatistics,
  getUsers,
  toggleUserBan,
  updateUserRole,
  getAdminMaterials,
  toggleMaterialApproval,
  deleteAdminMaterial,
  getAdminReports,
  updateReportStatus,
  getAdminCircles,
  deleteAdminCircle,
  getCategories,
  createCategory,
  deleteCategory,
} from '../controllers/admin.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Protect ALL admin routes with both authentication and ADMIN role check
router.use(authenticate, requireAdmin);

router.get('/statistics', getStatistics);
router.get('/users', getUsers);
router.put('/users/:id/ban', toggleUserBan);
router.put('/users/:id/role', updateUserRole);

router.get('/materials', getAdminMaterials);
router.put('/materials/:id/approve', toggleMaterialApproval);
router.delete('/materials/:id', deleteAdminMaterial);

router.get('/reports', getAdminReports);
router.put('/reports/:id/status', updateReportStatus);

router.get('/circles', getAdminCircles);
router.delete('/circles/:id', deleteAdminCircle);

router.get('/categories', getCategories);
router.post('/categories', createCategory);
router.delete('/categories/:id', deleteCategory);

export default router;
