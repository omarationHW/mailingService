import { Router } from 'express';
import { trackOpen, trackClick } from '../controllers/trackingController';

const router = Router();

router.get('/open/:token', trackOpen);
router.get('/click/:token', trackClick);

export default router;
