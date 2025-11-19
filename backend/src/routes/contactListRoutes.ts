import express from 'express';
import {
  getContactLists,
  getContactList,
  createContactList,
  updateContactList,
  deleteContactList,
  addContactsToList,
  removeContactFromList,
  getContactsInList,
} from '../controllers/contactListController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Contact list CRUD
router.get('/', getContactLists);
router.post('/', createContactList);
router.get('/:id', getContactList);
router.put('/:id', updateContactList);
router.delete('/:id', deleteContactList);

// Manage contacts in list
router.post('/:id/contacts', addContactsToList);
router.delete('/:id/contacts/:contactId', removeContactFromList);
router.get('/:id/contacts', getContactsInList);

export default router;
