import express from "express";
import { getAllTutors, getAllMyStudents, getTutorById, getAllMyHistory, getMyProfile, updateTutorProfile, getTutorDashboardData } from "../controllers/tutor.js"
import { authenticate } from "../middleware/authMiddleware.js";


const router = express.Router();

router.get("/allTutors", authenticate, getAllTutors);
router.get("/allStudents", authenticate, getAllMyStudents);
router.get("/myProfile", authenticate, getMyProfile);
router.get("/allHistory", authenticate, getAllMyHistory);
router.get("/getTutor/:id", authenticate, getTutorById);
router.put("/updateProfile", authenticate, updateTutorProfile);
router.get("/dashboard", authenticate, getTutorDashboardData);

export default router;