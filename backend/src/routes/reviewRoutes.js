import express from 'express';
import { addReview, getTutorReviews, deleteReviewContent } from '../controllers/review.js';
import { authenticate } from '../middleware/authMiddleware.js';


const router = express.Router();

router.post('/addReview', authenticate, addReview);
router.put('/deleteReview/:reviewId', authenticate, deleteReviewContent);
router.get('/reviews/:tutorId', authenticate, getTutorReviews);

export default router;