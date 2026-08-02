import { Router } from 'express';
import { getTutorNotifications } from '../controllers/notification.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/notifications', authenticate, getTutorNotifications);

export default router;