import { Router } from 'express';
import {
  gradeSubmission,
  buildRubric,
  generateFeedback,
  createQuiz,
} from '../controllers/ai.controller';
import { generalLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(generalLimiter);

router.post('/grade',    gradeSubmission);
router.post('/rubric',   buildRubric);
router.post('/feedback', generateFeedback);
router.post('/quiz',     createQuiz);

export default router;
