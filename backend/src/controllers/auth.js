import { User, Tutor } from '../models/index.js';
// import { OAuth2Client } from 'google-auth-library';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';


export const register = async (req, res) => {
    try {
        const {
            firstName, lastName, email, password,
            role,
            // phoneNumber, city, street, carModel, gearbox, pricePerLesson, lessonDuration, experienceYears, bio
        } = req.body;

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: "כתובת המייל כבר קיימת במערכת" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            role,
            // city,
            // street,
            // phoneNumber, city, street, carModel, gearbox, pricePerLesson, lessonDuration, experienceYears, bio
        });

        if (role === 'tutor') {
            await Tutor.create({
                userId: newUser.id,
                carModel,
                gearbox,
                pricePerLesson,
                lessonDuration,
                experienceYears,
                bio
            });
        }

        res.status(201).json({
            message: "משתמש נוצר בהצלחה",
            user: {
                id: newUser.id,
                email: newUser.email,
                role: newUser.role,
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "שגיאת שרת ביצירת משתמש" });
    }
};


export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ message: "משתמש לא נמצא" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "סיסמה שגויה" });
        }

        let tutorId = null;
        if (user.role === 'tutor') {
            const tutor = await Tutor.findOne({ where: { userId: user.id } });
            if (tutor) {
                tutorId = tutor.id;
            }
        }

        const token = jwt.sign(
            { id: user.id, role: user.role, tutorId: tutorId },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.status(200).json({
            message: "התחברת בהצלחה",
            token,
            user: {
                id: user.id,
                tutorId: tutorId,
                firstName: user.firstName,
                role: user.role,
                isSetupComplete: user.isSetupComplete
            }
        });

    }
    catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "שגיאה בתהליך ההתחברות" });
    }
};


export const deleteAccount = async (req, res) => {
    console.log("Starting deletion process...");
    try {
        const studentId = req.user.id;

        const deletedUser = await Student.findByIdAndDelete(studentId);

        if (!deletedUser) {
            return res.status(404).json({ message: "משתמש לא נמצא" });
        }

        // 2. אופציונלי: מחיקת נתונים קשורים (כמו שיעורים שנקבעו, הודעות וכו')
        // await Booking.deleteMany({ studentId: studentId });

        res.status(200).json({ message: "החשבון נמחק בהצלחה" });
    } catch (error) {
        console.error("Error deleting account:", error);
        res.status(500).json({ message: "שגיאת שרת פנימית בנסיון למחוק את החשבון" });
    }
};


export const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            return res.status(404).json({ message: "משתמש מחובר לא נמצא" });
        }

        res.json(user);

    } catch (error) {
        res.status(500).json({ message: "שגיאה בשליפת נתוני המשתמש הנוכחי" });
    }
};


export const getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'isSetupComplete', 'createdAt']
        });

        if (!users.length) {
            return res.status(200).json({ message: "אין משתמשים במערכת", users: [] });
        }

        res.status(200).json({ users });
    } catch (error) {
        console.error("שגיאה בשליפת כל המשתמשים:", error);
        res.status(500).json({ message: "שגיאת שרת בשליפת משתמשים" });
    }
};