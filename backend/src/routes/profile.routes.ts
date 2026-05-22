import { Router } from 'express';
import { SchoolProfileController } from '../controllers/SchoolProfileController.ts';

const router = Router();

router.get('/', SchoolProfileController.getProfile);
router.put('/', SchoolProfileController.updateProfile);

export default router;
