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
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Sequence CRUD
router.get('/', getSequences);
router.get('/:id', getSequence);
router.post('/', authorize('ADMIN', 'EDITOR'), createSequence);
router.put('/:id', authorize('ADMIN', 'EDITOR'), updateSequence);
router.delete('/:id', authorize('ADMIN', 'EDITOR'), deleteSequence);

// Manage sequence steps
router.put('/:id/steps', authorize('ADMIN', 'EDITOR'), updateSequenceSteps);

// Manage enrollments
router.post('/:id/enroll', authorize('ADMIN', 'EDITOR'), enrollContacts);
router.get('/:id/enroll-by-tags/preview', previewEnrollByTags);
router.post('/:id/enroll-by-tags', authorize('ADMIN', 'EDITOR'), enrollByTags);
router.delete('/:id/contacts/:contactId', authorize('ADMIN', 'EDITOR'), unenrollContact);
router.get('/:id/enrollments', getEnrollments);

// Analytics
router.get('/:id/analytics', getSequenceAnalytics);
router.get('/:id/export', exportSequenceReport);

export default router;
