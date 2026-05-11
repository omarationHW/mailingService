import express from 'express';
import {
  getContactLists,
  getContactList,
  createContactList,
  updateContactList,
  deleteContactList,
  batchDeleteContactLists,
  addContactsToList,
  removeContactFromList,
  batchRemoveFromList,
  getContactsInList,
  getListMeta,
} from '../controllers/contactListController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Contact list CRUD
router.get('/', getContactLists);
router.post('/', authorize('ADMIN', 'EDITOR'), createContactList);
router.delete('/batch', authorize('ADMIN', 'EDITOR'), batchDeleteContactLists);
router.get('/:id', getContactList);
router.put('/:id', authorize('ADMIN', 'EDITOR'), updateContactList);
router.delete('/:id', authorize('ADMIN', 'EDITOR'), deleteContactList);

// Manage contacts in list
router.get('/:id/contacts/meta', getListMeta);
router.post('/:id/contacts', authorize('ADMIN', 'EDITOR'), addContactsToList);
router.delete('/:id/contacts/batch', authorize('ADMIN', 'EDITOR'), batchRemoveFromList);
router.delete('/:id/contacts/:contactId', authorize('ADMIN', 'EDITOR'), removeContactFromList);
router.get('/:id/contacts', getContactsInList);

export default router;
