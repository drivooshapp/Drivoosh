import express from 'express';
import { authenticate } from "../middleware/authMiddleware.js";
import { createBooking, getMyBookings, updateBookingStatus, cancelBooking, completeBooking } from '../controllers/booking.js';


const router = express.Router();

router.post("/:studentId/newBooking", authenticate, createBooking);
router.get("/myHistory", authenticate, getMyBookings);
router.patch("/status", authenticate, updateBookingStatus);
router.patch("/:bookingId/cancel", authenticate, cancelBooking);
router.patch("/:bookingId/complete", authenticate, completeBooking);


export default router;