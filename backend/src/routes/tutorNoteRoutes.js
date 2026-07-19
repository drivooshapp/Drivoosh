import express from 'express';
import { createNote, deleteNote, getTutorNotes } from '../controllers/tutorNote.js';
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get('/allNotes', authenticate, getTutorNotes);
router.post('/addNote', authenticate, createNote);
router.delete('/deleteNote/:noteId', authenticate, deleteNote);

export default router;