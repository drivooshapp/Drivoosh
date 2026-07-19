import { User, TutorNote, Tutor } from '../models/index.js';
import { Op } from 'sequelize';



export const getTutorNotes = async (req, res) => {
    try {
        const { id, role } = req.user;

        if (role === 'tutor') {
            const tutor = await Tutor.findOne({ where: { userId: id } });
            
            if (!tutor) {
                return res.status(404).json({ message: "לא נמצא פרופיל מורה למשתמש זה" });
            }

            const notes = await TutorNote.findAll({
                where: { tutorId: tutor.id }, 
                order: [['createdAt', 'DESC']]
            });
            return res.status(200).json(notes);
        }

        if (role === 'student') {
            const student = await User.findByPk(id);

            if (!student || !student.myTutor) {
                return res.status(403).json({ message: "לא נמצא מורה משויך לתלמיד זה" });
            }

            const rawDate = student.studentFields?.tutorSelectedAt || student.createdAt;

            const filterDate = new Date(rawDate);
            filterDate.setHours(0, 0, 0, 0);

            const notes = await TutorNote.findAll({
                where: {
                    tutorId: student.myTutor,
                    createdAt: {
                        [Op.gte]: filterDate
                    }
                },
                order: [['createdAt', 'DESC']]
            });

            return res.status(200).json(notes);
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "שגיאת שרת" });
    }
};


export const createNote = async (req, res) => {
    try {
        const { content } = req.body;

        const tutor = await Tutor.findOne({ where: { userId: req.user.id } });
        if (!tutor) {
            return res.status(403).json({ message: "גישה נדחתה. רק מורים יכולים לכתוב הערות." });
        }

        if (!content || content.trim() === "") {
            return res.status(400).json({ message: "תוכן ההערה אינו יכול להיות ריק." });
        }

        if (content.length < 4 || content.length > 400) {
            return res.status(422).json({ message: "תוכן ההערה חייב להיות בין 4 ל-400 תווים." });
        }

        const newNote = await TutorNote.create({
            tutorId: tutor.id,
            content: content
        });

        res.status(201).json({ message: "ההערה נוספה בהצלחה", note: newNote });
    } catch (error) {
        res.status(500).json({ message: "שגיאת שרת ביצירת הערה", error: error.message });
    }
};


export const deleteNote = async (req, res) => {
    try {
        const { noteId } = req.params;
        const userId = req.user.id;

        const note = await TutorNote.findByPk(noteId, {
            include: [{
                model: Tutor,
                as: 'tutor'
            }]
        });

        if (!note) {
            return res.status(404).json({ message: "ההערה לא נמצאה." });
        }

        if (!note.tutor || note.tutor.userId !== userId) {
            return res.status(403).json({ message: "אין לך הרשאה למחוק הערה זו." });
        }

        await note.destroy();

        res.status(200).json({ message: "ההערה נמחקה בהצלחה" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "שגיאת שרת במחיקת הערה", error: error.message });
    }
};