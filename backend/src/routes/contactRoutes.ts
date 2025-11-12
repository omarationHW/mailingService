import { Router } from 'express';
import multer from 'multer';
import {
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
  importContacts,
  exportContacts,
} from '../controllers/contactController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate);

router.get('/', getContacts);
router.get('/export', exportContacts);
router.get('/:id', getContact);
router.post('/', authorize('ADMIN', 'EDITOR'), createContact);
router.put('/:id', authorize('ADMIN', 'EDITOR'), updateContact);
router.delete('/:id', authorize('ADMIN', 'EDITOR'), deleteContact);
router.post('/import', authorize('ADMIN', 'EDITOR'), upload.single('file'), importContacts);

export default router;
