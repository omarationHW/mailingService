import { Router } from 'express';
import { register, login, getMe, updateProfile, changePassword } from '../controllers/authController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.post('/register', authenticate, authorize('ADMIN'), register);
router.get('/me', authenticate, getMe);
router.put('/me', authenticate, updateProfile);
router.put('/me/password', authenticate, changePassword);

export default router;
