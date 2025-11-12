import { Router } from 'express';
import {
  getTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from '../controllers/templateController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getTemplates);
router.get('/:id', getTemplate);
router.post('/', authorize('ADMIN', 'EDITOR'), createTemplate);
router.put('/:id', authorize('ADMIN', 'EDITOR'), updateTemplate);
router.delete('/:id', authorize('ADMIN', 'EDITOR'), deleteTemplate);

export default router;
