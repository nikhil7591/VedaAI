import { Router } from 'express';
import {
  gradeSubmission,
  buildRubric,
  generateFeedback,
  createQuiz,
  extractTextFromImage,
  imageUpload,
} from '../controllers/ai.controller';
import { generalLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(generalLimiter);

router.post('/grade',    gradeSubmission);
router.post('/rubric',   buildRubric);
router.post('/feedback', generateFeedback);
router.post('/quiz',     createQuiz);
router.post('/extract-text', imageUpload.single('file'), extractTextFromImage);

export default router;
