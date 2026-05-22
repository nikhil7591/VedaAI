import { Router } from 'express';
import {
  createAssignment,
  createAssignmentSchema,
  getAssignment,
  getAssignmentStatus,
  listAssignments,
  deleteAssignment,
} from '../controllers/assignment.controller';
import { getPaper, regeneratePaper } from '../controllers/paper.controller';
import { validate } from '../middleware/validate';
import { createAssignmentLimiter, regenerateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Assignments
router.post('/',               createAssignmentLimiter, validate(createAssignmentSchema), createAssignment);
router.get('/',                listAssignments);
router.get('/:id',             getAssignment);
router.delete('/:id',          deleteAssignment);
router.get('/:id/status',      getAssignmentStatus);

// Paper sub-resource
router.get('/:id/paper',             getPaper);
router.post('/:id/regenerate',       regenerateLimiter, regeneratePaper);

export default router;
