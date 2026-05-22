import { Router } from 'express';
import assignmentRoutes from './assignment.routes';
import groupRoutes from './group.routes.ts';
import studentRoutes from './student.routes.ts';
import profileRoutes from './profile.routes.ts';

const router = Router();

router.use('/assignments', assignmentRoutes);
router.use('/groups', groupRoutes);
router.use('/students', studentRoutes);
router.use('/profile', profileRoutes);

// Health check
router.get('/health', (_req, res) => {
  res.json({ success: true, service: 'VedaAI API', timestamp: new Date().toISOString() });
});

export default router;
