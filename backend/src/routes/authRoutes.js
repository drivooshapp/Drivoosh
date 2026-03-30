import express from "express";
import {
    register, login, getCurrentUser, getAllUsers, deleteAccount
    // googleAuth,
} from "../controllers/auth.js";
import { authenticate } from "../middleware/authMiddleware.js";


const router = express.Router();

router.post("/register", register);
router.post("/login", login);
// router.post("/googleAuth", googleAuth);
router.get("/userProfile", authenticate, getCurrentUser);
router.get("/allUsers", authenticate, getAllUsers);
router.delete("/deleteAccount", authenticate, deleteAccount);

export default router;