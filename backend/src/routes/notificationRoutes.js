import { Router } from 'express';
import { getStudentGoalsForm, updateGoalProgress, updateFormHeader, exportFormToPDF } from '../controllers/goalForm.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/goalsForm/:studentId', authenticate, getStudentGoalsForm);

export default router;