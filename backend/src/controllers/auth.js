import { User, Tutor } from '../models/index.js';
// import { OAuth2Client } from 'google-auth-library';
import sgMail from '@sendgrid/mail';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';



// export const register = async (req, res) => {
//     try {
//         const {
//             firstName, lastName, email, password,
//             role,
//             // phoneNumber, city, street, carModel, gearbox, pricePerLesson, lessonDuration, experienceYears, bio
//         } = req.body;

//         const existingUser = await User.findOne({ where: { email } });
//         if (existingUser) {
//             return res.status(400).json({ message: "כתובת המייל כבר קיימת במערכת" });
//         }

//         const hashedPassword = await bcrypt.hash(password, 10);

//         const newUser = await User.create({
//             firstName,
//             lastName,
//             email,
//             password: hashedPassword,
//             role,
//             // city,
//             // street,
//             // phoneNumber, city, street, carModel, gearbox, pricePerLesson, lessonDuration, experienceYears, bio
//         });

//         if (role === 'tutor') {
//             await Tutor.create({
//                 userId: newUser.id,
//                 carModel,
//                 gearbox,
//                 pricePerLesson,
//                 lessonDuration,
//                 experienceYears,
//                 bio
//             });
//         }

//         res.status(201).json({
//             message: "משתמש נוצר בהצלחה",
//             user: {
//                 id: newUser.id,
//                 email: newUser.email,
//                 role: newUser.role,
//             }
//         });

//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: "שגיאת שרת ביצירת משתמש" });
//     }
// };
export const register = async (req, res) => {
    try {
        const {
            firstName, lastName, email, password, role,
            carModel, gearbox, pricePerLesson, lessonDuration, experienceYears, bio // שים לב ששחררתי מהערה את מה שאתה משתמש בו למטה
        } = req.body;

        if (!password || password.length < 6 || password.length > 12) {
            return res.status(400).json({ message: "הסיסמה חייבת לכלול בין 6 ל-12 תווים" });
        }

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


export const forgotPassword = async (req, res) => {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    try {
        const { email } = req.body;
        const user = await User.findOne({ where: { email } });

        if (!user) return res.status(200).json({ message: "נשלח קוד למייל" });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        user.resetPasswordToken = await bcrypt.hash(otp, 10);
        user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
        await user.save();

        await sgMail.send({
            to: email,
            from: process.env.FROM_EMAIL,
            subject: 'קוד אימות לאיפוס סיסמה - Drivoosh',
            html: `<div style="direction: rtl; text-align: right;">
                    <h2>שלום ${user.firstName},</h2>
                    <p>הקוד שלך לאיפוס הסיסמה הוא: <b style="font-size: 20px;">${otp}</b></p>
                    <p>הקוד תקף ל-10 דקות.</p>
                   </div>`
        });

        res.status(200).json({ message: "הקוד נשלח בהצלחה" });
    } 
    catch (e) {
        console.log("error ", error.response?.data?.message || error.response)
        res.status(500).json({ message: "שגיאה בשליחת המייל" });
    }
};


export const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        const user = await User.findOne({ where: { email } });

        if (!user || !user.resetPasswordToken || user.resetPasswordExpires < Date.now()) {
            return res.status(400).json({ message: "הקוד פג תוקף או לא קיים" });
        }

        const isValid = await bcrypt.compare(otp, user.resetPasswordToken);
        if (!isValid) return res.status(400).json({ message: "קוד שגוי" });

        user.password = await bcrypt.hash(newPassword, 10);
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();

        res.status(200).json({ message: "הסיסמה שונתה בהצלחה" });
    } catch (e) {
        res.status(500).json({ message: "שגיאה באיפוס הסיסמה" });
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