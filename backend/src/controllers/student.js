import { User } from "../models/index.js";



export const getMyProfile = async (req, res) => {
    try {
        const student = await User.findByPk(req.user.id, {
            attributes: ['id', 'firstName', 'lastName', 'email', 'profileImage', 'role', 'createdAt']
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
        const { firstName, lastName, profileImage } = req.body;
        const userId = req.user.id;

        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({ message: "משתמש לא נמצא" });
        }

        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (profileImage) user.profileImage = profileImage;

        user.isSetupComplete = true;

        await user.save();

        res.status(200).json({
            message: "הפרופיל עודכן בהצלחה",
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                profileImage: user.profileImage,
                isSetupComplete: user.isSetupComplete
            }
        });
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ message: "שגיאה בעדכון פרטי התלמיד" });
    }
};


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