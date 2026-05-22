import { Router } from 'express';
import { GroupController } from '../controllers/GroupController.ts';

const router = Router();

router.get('/', GroupController.list);
router.post('/', GroupController.create);
router.get('/:id', GroupController.getById);
router.put('/:id', GroupController.update);
router.delete('/:id', GroupController.delete);

export default router;
