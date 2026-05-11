import express from 'express';
import {
  getSequences,
  getSequence,
  createSequence,
  updateSequence,
  deleteSequence,
  updateSequenceSteps,
  enrollContacts,
  enrollByTags,
  previewEnrollByTags,
  unenrollContact,
  getEnrollments,
  getSequenceAnalytics,
  exportSequenceReport,
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
router.get('/:id/enroll-by-tags/preview', previewEnrollByTags);
router.post('/:id/enroll-by-tags', enrollByTags);
router.delete('/:id/contacts/:contactId', unenrollContact);
router.get('/:id/enrollments', getEnrollments);

// Analytics
router.get('/:id/analytics', getSequenceAnalytics);
router.get('/:id/export', exportSequenceReport);

export default router;
