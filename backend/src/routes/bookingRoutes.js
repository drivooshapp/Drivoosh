import express from 'express';
import { authenticate } from "../middleware/authMiddleware.js";
import { createBooking, getMyBookings, getBookingById, getAvailableSlots, updateBookingStatus, cancelBooking, completeBooking } from '../controllers/booking.js';


const router = express.Router();

router.post("/:studentId/newBooking", authenticate, createBooking);
router.get("/myHistory", authenticate, getMyBookings);
router.get("/booking/:bookingId", authenticate, getBookingById);
router.get("/tutor/:tutorId/availableSlots", authenticate, getAvailableSlots);
router.put("/status", authenticate, updateBookingStatus);
router.put("/cancel/:bookingId", authenticate, cancelBooking);
router.put("/:bookingId/complete", authenticate, completeBooking);

export default router;