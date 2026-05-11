import { Router } from 'express';
import multer from 'multer';
import {
  getContacts,
  getContact,
  getContactMeta,
  checkEmailExists,
  createContact,
  updateContact,
  deleteContact,
  batchDeleteContacts,
  batchUpdateContacts,
  previewImport,
  importContacts,
  exportContacts,
  downloadTemplate,
} from '../controllers/contactController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate);

router.get('/', getContacts);
router.get('/meta', getContactMeta);
router.get('/check-email', checkEmailExists);
router.get('/export', exportContacts);
router.get('/template', downloadTemplate);
router.post('/import/preview', authorize('ADMIN', 'EDITOR'), upload.single('file'), previewImport);
router.post('/import', authorize('ADMIN', 'EDITOR'), importContacts);
router.delete('/batch', authorize('ADMIN', 'EDITOR'), batchDeleteContacts);
router.put('/batch', authorize('ADMIN', 'EDITOR'), batchUpdateContacts);
router.get('/:id', getContact);
router.post('/', authorize('ADMIN', 'EDITOR'), createContact);
router.put('/:id', authorize('ADMIN', 'EDITOR'), updateContact);
router.delete('/:id', authorize('ADMIN', 'EDITOR'), deleteContact);

export default router;
