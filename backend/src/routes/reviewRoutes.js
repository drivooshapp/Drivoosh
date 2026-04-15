import express from 'express';
import { addReview, getTutorReviews } from '../controllers/review.js';
import { authenticate } from '../middleware/authMiddleware.js';


const router = express.Router();

router.post('/addReview', authenticate, addReview);
router.get('/tutor/:tutorId', authenticate, getTutorReviews);

export default router;