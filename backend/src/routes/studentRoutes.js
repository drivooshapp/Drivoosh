import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { getAllUsers,getStudentProfile, getMyProfile,getTutorStudentHistory, updateStudentProfile,updateExternalLessons, selectTutor, unselectTutor } from "../controllers/student.js"


const router = express.Router();

router.get("/allUsers", authenticate, getAllUsers);
router.get("/getStudent/:studentId", authenticate, getStudentProfile);
router.get("/myProfile", authenticate, getMyProfile);
router.get("/studentHistory/:studentId", authenticate, getTutorStudentHistory);
router.put("/updateProfile", authenticate, updateStudentProfile);
router.put("/updateExternalLessons/:studentId", updateExternalLessons);
router.put("/selectTutor/:tutorId", authenticate, selectTutor);
router.put("/unselectTutor", authenticate, unselectTutor);


export default router;