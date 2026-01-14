import express from 'express';
import {
  getSequences,
  getSequence,
  createSequence,
  updateSequence,
  deleteSequence,
  updateSequenceSteps,
  enrollContacts,
  unenrollContact,
  getEnrollments,
  getSequenceAnalytics,
} from '../controllers/sequenceController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Sequence CRUD
router.get('/', getSequences);
router.post('/', createSequence);
router.get('/:id', getSequence);
router.put('/:id', updateSequence);
router.delete('/:id', deleteSequence);

// Manage sequence steps
router.put('/:id/steps', updateSequenceSteps);

// Manage enrollments
router.post('/:id/enroll', enrollContacts);
router.delete('/:id/contacts/:contactId', unenrollContact);
router.get('/:id/enrollments', getEnrollments);

// Analytics
router.get('/:id/analytics', getSequenceAnalytics);

export default router;
