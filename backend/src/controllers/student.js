import { model } from "mongoose";
import { Op } from "sequelize";
import { User, Tutor, Booking } from "../models/index.js";



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


export const getMyProfile = async (req, res) => {
    try {
        const student = await User.findByPk(req.user.id, {
            attributes:
                ['id', 'firstName', 'lastName', 'identityNumber', 'email', 'phoneNumber', 'street', 'city', 'profileImage', 'role', 'createdAt'],
            include: [{
                model: Tutor,
                as: 'chosenTutor',
                attributes: ['id', 'pricePerLesson', 'lessonDuration'],
                include: [{
                    model: User,
                    as: 'user',
                    attributes: ['id', 'firstName', 'lastName', 'profileImage', 'phoneNumber']
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


// export const getCurrentUser = async (req, res) => {
//     try {
//         const user = await User.findByPk(req.user.id, {
//             attributes: { exclude: ['password'] }
//         });

//         if (!user) {
//             return res.status(404).json({ message: "משתמש מחובר לא נמצא" });
//         }

//         res.json(user);

//     } catch (error) {
//         res.status(500).json({ message: "שגיאה בשליפת נתוני המשתמש הנוכחי" });
//     }
// };


export const getStudentProfile = async (req, res) => {
    const { studentId } = req.params;

    try {
        const student = await User.findByPk(studentId, {
            attributes: ["id", "firstName", "lastName", "email", "phoneNumber", "street", "city", "profileImage", "createdAt"],
            include: [{
                model: Tutor,
                as: "chosenTutor",
                attributes: ["id", "pricePerLesson", "lessonDuration"]
            }]
        });

        if (!student) {
            return res.status(404).json({ message: "תלמיד לא נמצא" });
        }

        const bookings = await Booking.findAll({
            where: { studentId },
            order: [
                ["lessonDate", "ASC"],
                ["startTime", "ASC"]
            ]
        });

        const completedLessons = bookings.filter(b => b.status === "completed");
        const pendingOrConfirmed = bookings.filter(b => b.status === "pending" || b.status === "confirmed");
        const cancelledLessons = bookings.filter(b => b.status === "cancelled");

        const totalPaid = completedLessons.reduce((sum, b) => sum + parseFloat(b.priceAtBooking || 0), 0);
        const upcomingRevenue = pendingOrConfirmed.reduce((sum, b) => sum + parseFloat(b.priceAtBooking || 0), 0);

        const locationCounts = {};
        bookings.forEach(b => {
            if (b.pickupLocation) {
                locationCounts[b.pickupLocation] = (locationCounts[b.pickupLocation] || 0) + 1;
            }
        });
        const preferredPickup = Object.keys(locationCounts).reduce((a, b) =>
            locationCounts[a] > locationCounts[b] ? a : b, null
        );

        const now = new Date();
        const nextLesson = bookings.find(b =>
            (b.status === "pending" || b.status === "confirmed") && new Date(b.lessonDate) >= now
        ) || null;

        const pastLessons = bookings.filter(b => new Date(b.lessonDate) < now);
        const lastLesson = pastLessons[pastLessons.length - 1] || null;

        const monthsMap = {};
        const monthNamesHe = ["ינו׳", "פבר׳", "מרץ", "אפר׳", "מאי", "יוני", "יולי", "אוג׳", "ספט׳", "אוק׳", "נוב׳", "דצמ׳"];

        completedLessons.forEach(b => {
            const date = new Date(b.lessonDate);
            const monthIndex = date.getMonth();
            const year = date.getFullYear();
            const key = `${year}-${monthIndex}`;

            if (!monthsMap[key]) {
                monthsMap[key] = {
                    sortKey: year * 12 + monthIndex,
                    label: `${monthNamesHe[monthIndex]} ${String(year).substring(2)}`,
                    count: 0
                };
            }
            monthsMap[key].count += 1;
        });

        const sortedMonths = Object.values(monthsMap)
            .sort((a, b) => a.sortKey - b.sortKey)
            .map(item => ({
                label: item.label,
                count: item.count
            }));

        return res.status(200).json({
            student: {
                id: student.id,
                firstName: student.firstName,
                lastName: student.lastName,
                email: student.email,
                phoneNumber: student.phoneNumber,
                city: student.city,
                street: student.street,
                profileImage: student.profileImage,
                createdAt: student.createdAt,
                lessonPrice: student.chosenTutor?.pricePerLesson || 0,
                lessonDuration: student.chosenTutor?.lessonDuration || 45
            },
            statistics: {
                totalLessonsCount: bookings.length,
                completedLessons: completedLessons.length,
                pendingLessons: pendingOrConfirmed.length,
                cancelledLessons: cancelledLessons.length,
                cancellationRate: bookings.length > 0 ? Math.round((cancelledLessons.length / bookings.length) * 100) : 0
            },
            financials: {
                totalPaid,
                upcomingRevenue
            },
            preferences: {
                preferredPickup: preferredPickup || "לא הוגדר עדיין"
            },
            nextLesson: nextLesson ? {
                id: nextLesson.id,
                date: nextLesson.lessonDate,
                startTime: nextLesson.startTime,
                endTime: nextLesson.endTime,
                pickupLocation: nextLesson.pickupLocation,
                status: nextLesson.status
            } : null,
            lastLesson: lastLesson ? {
                id: lastLesson.id,
                date: lastLesson.lessonDate,
                startTime: lastLesson.startTime,
                endTime: lastLesson.endTime,
                pickupLocation: lastLesson.pickupLocation,
                status: lastLesson.status
            } : null,
            lastGoalsForm: {
                exists: false
            },
            chartData: sortedMonths
        });

    } catch (error) {
        console.error("error", error);
        return res.status(500).json({ message: "שגיאה בשליפת פרופיל התלמיד" });
    }
};


export const updateStudentProfile = async (req, res) => {
    try {
        const { firstName, lastName, identityNumber, phoneNumber, city, street, profileImage } = req.body;
        const userId = req.user.id;

        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({ message: "משתמש לא נמצא" });
        }

        if (firstName !== undefined) user.firstName = firstName;
        if (lastName !== undefined) user.lastName = lastName;
        if (identityNumber !== undefined) user.identityNumber = identityNumber;
        if (phoneNumber !== undefined) user.phoneNumber = phoneNumber || user.phoneNumber;
        if (city !== undefined) user.city = city;
        if (street !== undefined) user.street = street;
        if (profileImage !== undefined) user.profileImage = profileImage;

        const isAllFieldsFull =
            user.firstName?.trim() &&
            user.lastName?.trim() &&
            user.identityNumber?.trim() &&
            user.phoneNumber?.trim() &&
            user.city?.trim() &&
            user.street?.trim();

        user.isSetupComplete = !!isAllFieldsFull;

        await user.save();

        const updatedUser = await User.findByPk(userId, {
            include: [{
                model: Tutor,
                as: 'chosenTutor',
                include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName', 'identityNumber', 'phoneNumber', 'profileImage'] }]
            }]
        });

        res.status(200).json({
            message: "הפרופיל עודכן בהצלחה",
            user: updatedUser
        });
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ message: "שגיאה בעדכון הפרטים" });
    }
};


export const getTutorStudentHistory = async (req, res) => {
    const tutorId = req.user.tutorId;
    const { studentId } = req.params;

    try {
        const now = new Date();

        const history = await Booking.findAll({
            where: {
                studentId,
                tutorId,
                [Op.or]: [
                    { status: "completed" },
                ]
            },
            order: [
                ["lessonDate", "DESC"],
                ["startTime", "DESC"]
            ]
        });

        return res.status(200).json(history);
    } catch (error) {
        console.error("error", error);
        return res.status(500).json({ message: "שגיאה בשליפת ההיסטוריה" });
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

        await Booking.update(
            { status: 'cancelled' },
            {
                where: {
                    studentId: studentId,
                    status: ['pending', 'confirmed']
                }
            }
        );

        await student.save();

        res.status(200).json({ message: 'המורה נבחר בהצלחה', user: student });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'שגיאת שרת בבחירת המורה' });
    }
};


export const unselectTutor = async (req, res) => {
    const studentId = req.user.id;

    try {
        const student = await User.findByPk(studentId);
        if (!student) return res.status(404).json({ message: 'התלמיד לא נמצא' });

        student.myTutor = null;

        await Booking.update(
            { status: 'cancelled' },
            {
                where: {
                    studentId: studentId,
                    status: ['pending', 'confirmed']
                }
            }
        );

        await student.save();

        res.status(200).json({ message: 'המורה הוסר בהצלחה', user: student });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'שגיאת שרת בהסרת המורה' });
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