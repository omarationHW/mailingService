import { Router } from 'express';
import {
  getDashboardAnalytics,
  getCampaignAnalytics,
  exportCampaignReport,
} from '../controllers/analyticsController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/dashboard', getDashboardAnalytics);
router.get('/campaigns/:id', getCampaignAnalytics);
router.get('/campaigns/:id/export', exportCampaignReport);

export default router;
