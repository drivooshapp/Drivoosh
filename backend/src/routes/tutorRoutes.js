import express from "express";
import { getAllTutors, getAllMyStudents, getTutorById, getAllMyHistory, getMyProfile, updateTutorProfile, getTutorWeeklySchedule, getTutorDashboardData } from "../controllers/tutor.js"
import { authenticate } from "../middleware/authMiddleware.js";


const router = express.Router();

router.get("/allTutors", authenticate, getAllTutors);
router.get("/allStudents", authenticate, getAllMyStudents);
router.get("/myProfile", authenticate, getMyProfile);
router.get("/allHistory", authenticate, getAllMyHistory);
router.get("/getTutor/:id", authenticate, getTutorById);
router.get("/dashboard", authenticate, getTutorDashboardData);
router.get("/weeklySchedule", authenticate, getTutorWeeklySchedule);
router.put("/updateProfile", authenticate, updateTutorProfile);

export default router;