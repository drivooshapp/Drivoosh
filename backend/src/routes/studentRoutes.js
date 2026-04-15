import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { getMyProfile, updateStudentProfile, selectTutor, unselectTutor, deleteStudentAccount } from "../controllers/student.js"


const router = express.Router();

router.get("/myProfile", authenticate, getMyProfile);
router.put("/updateProfile", authenticate, updateStudentProfile);
router.put("/selectTutor/:tutorId", authenticate, selectTutor);
router.put("/unselectTutor", authenticate, unselectTutor);

router.delete("/deleteAccount", authenticate, deleteStudentAccount);


export default router;