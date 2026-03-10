import express from "express";
import { register, login, getCurrentUser, getAllUsers } from "../controllers/auth.js";
import { authenticate } from "../middleware/authMiddleware.js";


const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/userProfile", authenticate, getCurrentUser);
router.get("/allUsers", authenticate, getAllUsers);

export default router;