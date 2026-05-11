import { Router } from 'express';
import {
  getCampaigns,
  getCampaignStats,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  sendCampaign,
  retryFailedEmails,
  previewRecipients,
} from '../controllers/campaignController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getCampaigns);
router.get('/stats', getCampaignStats);
router.get('/preview-recipients', previewRecipients);
router.get('/:id', getCampaign);
router.post('/', authorize('ADMIN', 'EDITOR'), createCampaign);
router.put('/:id', authorize('ADMIN', 'EDITOR'), updateCampaign);
router.delete('/:id', authorize('ADMIN', 'EDITOR'), deleteCampaign);
router.post('/:id/send', authorize('ADMIN', 'EDITOR'), sendCampaign);
router.post('/:id/retry-failed', authorize('ADMIN', 'EDITOR'), retryFailedEmails);

export default router;
