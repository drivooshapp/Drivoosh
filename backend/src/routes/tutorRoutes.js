import express from "express";
import { getAllTutors, getTutorById, getMyProfile, updateTutorProfile, getTutorDashboardData } from "../controllers/tutor.js"
import { authenticate } from "../middleware/authMiddleware.js";


const router = express.Router();

router.get("/allTutors", authenticate, getAllTutors);
router.get("/myProfile", authenticate, getMyProfile);
router.get("/getTutor/:id", authenticate, getTutorById);
router.put("/updateProfile", authenticate, updateTutorProfile);
router.get("/dashboard", authenticate, getTutorDashboardData);

export default router;