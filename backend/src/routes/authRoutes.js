import express from "express";
import {
    register, login, forgotPassword, resetPassword, deleteAccount
    // googleAuth,
} from "../controllers/auth.js";
import { authenticate } from "../middleware/authMiddleware.js";


const router = express.Router();

router.post("/register", register);
router.post("/login", login);
// router.post("/googleAuth", googleAuth);
router.post('/forgotPassword', forgotPassword);
router.post('/resetPassword', resetPassword);
router.delete("/deleteAccount", authenticate, deleteAccount);

export default router;