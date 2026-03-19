import { User, Tutor } from '../models/index.js';
// import { OAuth2Client } from 'google-auth-library';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';



export const register = async (req, res) => {
    try {
        const { firstName, lastName, email, password, role } = req.body;

        const existingUser = await User.findOne({ where: { email } });

        if (existingUser) {
            return res.status(400).json({ message: "האימייל כבר קיים במערכת" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            role
        });

        if (role === 'tutor') {
            await Tutor.create({ userId: newUser.id });
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

        console.log("Password from input:", password);
console.log("Password from DB (hash):", user.password);

// אם אחד מהם undefined, ה-bcrypt יזרוק את השגיאה שראית
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "סיסמה שגויה" });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.status(200).json({
            message: "התחברת בהצלחה",
            token,
            user: {
                id: user.id,
                firstName: user.firstName,
                role: user.role,
                isSetupComplete: user.isSetupComplete
            }
        });

    } 
    // catch (error) {
    //     res.status(500).json({ message: "שגיאה בתהליך ההתחברות" });
    // }
    catch (error) {
        // הלוג הכי חשוב: מדפיס את השגיאה המלאה לטרמינל
        console.error("--- Login Process Error ---");
        console.error(error); 
        console.error("---------------------------");

        res.status(500).json({ 
            message: "שגיאה בתהליך ההתחברות",
            error: error.message // אופציונלי: להחזיר את פירוט השגיאה גם ל-Client בזמן פיתוח
        });
    }
};


// export const googleAuth = async (req, res) => {
//     const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

//     try {
//         const { idToken } = req.body;
//         const ticket = await client.verifyIdToken({
//             idToken,
//             audience: process.env.GOOGLE_CLIENT_ID,
//         });

//         const payload = ticket.getPayload();

//         const { email, given_name, family_name, sub: googleId } = payload;

//         let user = await User.findOne({ where: { email } });

//         if (!user) {
//             const hashedPassword = await bcrypt.hash(Math.random().toString(36), 10);

//             user = await User.create({
//                 firstName: given_name || 'User',
//                 lastName: family_name || '',
//                 email,
//                 password: hashedPassword,
//                 role: 'student'
//             });
//         }

//         const token = jwt.sign(
//             { id: user.id, role: user.role },
//             process.env.JWT_SECRET,
//             { expiresIn: '30d' }
//         );

//         res.status(200).json({
//             message: "התחברת בהצלחה עם Google",
//             token,
//             user: { id: user.id, firstName: user.firstName, role: user.role }
//         });

//     } catch (error) {
//         console.error("Google Auth Error:", error);
//         res.status(500).json({ message: "שגיאה באימות מול גוגל" });
//     }
// };


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