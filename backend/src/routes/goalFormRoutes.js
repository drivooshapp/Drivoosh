import { Router } from 'express';
import { getStudentGoalsForm, updateGoalProgress, updateFormHeader, exportFormToPDF } from '../controllers/goalForm.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/goalsForm/:studentId', authenticate, getStudentGoalsForm);
router.post('/updateGoalProgress', authenticate, updateGoalProgress);
router.post('/updateFormHeader', authenticate, updateFormHeader);
router.get('/exportPDF/:studentId', authenticate, exportFormToPDF);

export default router;