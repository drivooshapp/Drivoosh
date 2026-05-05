import { model } from "mongoose";
import { User, Tutor } from "../models/index.js";



export const getMyProfile = async (req, res) => {
    try {
        const student = await User.findByPk(req.user.id, {
            attributes:
                ['id', 'firstName', 'lastName', 'email', 'phoneNumber', 'street', 'city', 'profileImage', 'role', 'createdAt'],
            include: [{
                model: Tutor,
                as: 'chosenTutor',
                attributes: ['id', 'pricePerLesson'],
                include: [{
                    model: User,
                    as: 'user',
                    attributes: ['id', 'firstName', 'lastName', 'profileImage']
                }]
            }]
        });

        if (!student) {
            return res.status(404).json({ message: "משתמש לא נמצא" });
        }

        res.status(200).json(student);

    } catch (error) {
        res.status(500).json({ message: "שגיאה בשליפת פרופיל התלמיד" });
    }
};


export const updateStudentProfile = async (req, res) => {
    try {
        const { firstName, lastName, phoneNumber, city, street, profileImage } = req.body;
        const userId = req.user.id;

        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({ message: "משתמש לא נמצא" });
        }

        if (firstName !== undefined) user.firstName = firstName;
        if (lastName !== undefined) user.lastName = lastName;
        if (phoneNumber !== undefined) user.phoneNumber = phoneNumber || user.phoneNumber;
        if (city !== undefined) user.city = city;
        if (street !== undefined) user.street = street;
        if (profileImage !== undefined) user.profileImage = profileImage;

        const isAllFieldsFull =
            user.firstName?.trim() &&
            user.lastName?.trim() &&
            user.phoneNumber?.trim() &&
            user.city?.trim() &&
            user.street?.trim();

        user.isSetupComplete = !!isAllFieldsFull;

        await user.save();

        const updatedUser = await User.findByPk(userId, {
            include: [{
                model: Tutor,
                as: 'chosenTutor',
                include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName', 'phoneNumber', 'profileImage'] }]
            }]
        });

        res.status(200).json({
            message: "הפרופיל עודכן בהצלחה",
            user: updatedUser
        });
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ message: "שגיאה בעדכון פרטי התלמיד" });
    }
};


export const selectTutor = async (req, res) => {
    try {
        const { tutorId } = req.params;
        const studentId = req.user.id;

        const tutor = await Tutor.findByPk(tutorId);
        if (!tutor) return res.status(404).json({ message: 'המורה לא נמצא' });

        const student = await User.findByPk(studentId);
        if (!student) return res.status(404).json({ message: 'התלמיד לא נמצא' });

        student.myTutor = tutorId;

        await student.save();

        res.status(200).json({ message: 'המורה נבחר בהצלחה', user: student });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'שגיאת שרת בעדכון המורה' });
    }
};


export const unselectTutor = async (req, res) => {
    const studentId = req.user.id;

    try {
        const student = await User.findByPk(studentId);

        if (!student) return res.status(404).json({ message: 'התלמיד לא נמצא' });

        student.myTutor = null;

        await student.save();

        res.status(200).json({ message: 'המורה הוסר בהצלחה', user: student });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'שגיאת שרת בעדכון המורה' });
    }
}

export const deleteStudentAccount = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({ message: "משתמש לא נמצא" });
        }

        await user.destroy();

        res.status(200).json({ message: "חשבון התלמיד נמחק בהצלחה מהמערכת" });
    } catch (error) {
        console.error("Error deleting account:", error);
        res.status(500).json({ message: "שגיאה בתהליך מחיקת החשבון" });
    }
};