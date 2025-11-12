import { Router } from 'express';
import {
  getCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  sendCampaign,
} from '../controllers/campaignController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getCampaigns);
router.get('/:id', getCampaign);
router.post('/', authorize('ADMIN', 'EDITOR'), createCampaign);
router.put('/:id', authorize('ADMIN', 'EDITOR'), updateCampaign);
router.delete('/:id', authorize('ADMIN', 'EDITOR'), deleteCampaign);
router.post('/:id/send', authorize('ADMIN', 'EDITOR'), sendCampaign);

export default router;
