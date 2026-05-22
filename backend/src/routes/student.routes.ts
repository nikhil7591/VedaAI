import { Router } from 'express';
import { StudentController } from '../controllers/StudentController.ts';

const router = Router();

router.get('/group/:groupId', StudentController.listByGroup);
router.post('/group/:groupId', StudentController.create);
router.put('/:id', StudentController.update);
router.delete('/:id', StudentController.delete);

export default router;
