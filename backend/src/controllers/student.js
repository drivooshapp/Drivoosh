import { model } from "mongoose";
import { Op } from "sequelize";
import { User, Tutor, Booking, Notification } from "../models/index.js";
import { NOTIFICATION_TYPES } from "../models/Notification.js";
import { autoCancelExpiredBookings } from "../utils/bookingUtils.js";
import { validateStudentCanDisconnectOrSwitchTutor } from "../utils/studentTutorValidation.js";


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
    const currentTutorId = req.user.tutorId;
    try {
        await autoCancelExpiredBookings();

        const student = await User.findByPk(studentId, {
            attributes: ["id", "firstName", "lastName", "email", "phoneNumber", "street", "city", "profileImage", "createdAt", "studentFields"],
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

        const currentTutorBookings = bookings.filter(b => String(b.tutorId) === String(currentTutorId));
        const completedLessons = currentTutorBookings.filter(b => b.status === "completed");
        const pendingOrConfirmed = currentTutorBookings.filter(b => b.status === "pending" || b.status === "confirmed");
        const cancelledLessons = currentTutorBookings.filter(b => b.status === "cancelled");

        const completedWithOtherTutors = bookings.filter(
            b => String(b.tutorId) !== String(currentTutorId) && b.status === "completed"
        ).length;

        const studentFields = student.studentFields || {};
        const externalLessonsCount = Number(studentFields.externalLessonsCount) || 0;
        const externalLessonsProofUrl = studentFields.externalLessonsProofUrl || null;
        const isExternalLessonsVerified = Boolean(studentFields.isExternalLessonsVerified);

        const previousLessonsCount = completedWithOtherTutors + externalLessonsCount;
        const totalOverallCompletedLessons = completedLessons.length + previousLessonsCount;

        const totalPaid = completedLessons.reduce((sum, b) => sum + parseFloat(b.priceAtBooking || 0), 0);
        const upcomingRevenue = pendingOrConfirmed.reduce((sum, b) => sum + parseFloat(b.priceAtBooking || 0), 0);

        const now = new Date();
        const nextLesson = bookings.find(b =>
            (b.status === "pending" || b.status === "confirmed") && new Date(b.lessonDate) >= now
        ) || null;

        const pastLessons = bookings.filter(b => new Date(b.lessonDate) < now);
        const lastLesson = pastLessons[pastLessons.length - 1] || null;

        const hasUncompletedPastConfirmedLesson = currentTutorBookings.some(b => {
            if (b.status !== 'confirmed') return false;

            const dateOnly = b.lessonDate instanceof Date
                ? b.lessonDate.toISOString().split('T')[0]
                : String(b.lessonDate).split('T')[0];

            const lessonDateTime = new Date(`${dateOnly}T${b.endTime || '23:59:59'}`);

            if (isNaN(lessonDateTime.getTime())) {
                return false;
            }

            const isPast = lessonDateTime < now;

            return isPast;
        });

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
                lessonDuration: student.chosenTutor?.lessonDuration || 45,
                studentFields
            },
            statistics: {
                completedWithCurrentTutor: completedLessons.length,
                previousLessonsCount,
                externalLessonsCount,
                externalLessonsProofUrl,
                isExternalLessonsVerified,
                totalOverallCompletedLessons,
                totalLessonsCount: bookings.length,
                completedLessons: completedLessons.length,
                pendingLessons: pendingOrConfirmed.length,
                cancelledLessons: cancelledLessons.length,
                cancellationRate: bookings.length > 0 ? Math.round((cancelledLessons.length / bookings.length) * 100) : 0,
                hasUncompletedPastConfirmedLesson
            },
            financials: {
                totalPaid,
                upcomingRevenue
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


export const updateExternalLessons = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { externalLessonsCount, externalLessonsProofUrl, isVerified } = req.body;

        const student = await User.findByPk(studentId);
        if (!student) {
            return res.status(404).json({ message: "תלמיד לא נמצא" });
        }

        let finalProofUrl = externalLessonsProofUrl !== undefined
            ? externalLessonsProofUrl
            : (student.studentFields?.externalLessonsProofUrl || null);

        // =========================================================================
        // 📌 לוגיקת העלאה לקובץ פיזי (אם קיים):
        // if (req.file) {
        //   finalProofUrl = uploadedFileUrl;
        // }
        // =========================================================================

        // ביוצר אובייקט עדכני המשלב את השדות הקיימים ב-studentFields
        const currentFields = student.studentFields || {};
        const updatedStudentFields = {
            ...currentFields,
            externalLessonsCount: Number(externalLessonsCount),
            externalLessonsProofUrl: finalProofUrl,
            isExternalLessonsVerified: isVerified !== undefined ? Boolean(isVerified) : true
        };

        student.studentFields = updatedStudentFields;
        student.changed('studentFields', true);

        await student.save();

        return res.json({
            message: "עודכן בהצלחה",
            studentFields: updatedStudentFields,
            proofUrl: finalProofUrl
        });

    } catch (error) {
        console.error("Error in updateExternalLessons:", error);
        return res.status(500).json({ message: "שגיאה בעדכון הנתונים" });
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


// export const selectTutor = async (req, res) => {
//     try {
//         const { tutorId } = req.params;
//         const studentId = req.user.id;

//         const tutor = await Tutor.findByPk(tutorId);
//         if (!tutor) return res.status(404).json({ message: 'המורה לא נמצא' });

//         const student = await User.findByPk(studentId);
//         if (!student) return res.status(404).json({ message: 'התלמיד לא נמצא' });

//         const currentTutorId = student.myTutor;

//         if (currentTutorId) {
//             const validationResult = await validateStudentCanDisconnectOrSwitchTutor(studentId, currentTutorId);
//             if (!validationResult.allowed) {
//                 return res.status(validationResult.status).json({ message: validationResult.message });
//             }

//             await Notification.destroy({
//                 where: {
//                     studentId,
//                     tutorId: currentTutorId,
//                     type: NOTIFICATION_TYPES.PENDING_GOALS
//                 }
//             });
//         }

//         student.myTutor = tutorId;

//         student.studentFields = {
//             ...(student.studentFields || {}),
//             tutorSelectedAt: new Date()
//         };

//         student.changed('studentFields', true);

//         await Booking.update(
//             { status: 'cancelled' },
//             {
//                 where: {
//                     studentId: studentId,
//                     tutorId: currentTutorId,
//                     status: ['pending', 'confirmed']
//                 }
//             }
//         );

//         await student.save();
//         res.status(200).json({ message: 'המורה נבחר בהצלחה', user: student });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'שגיאת שרת בבחירת המורה' });
//     }
// };


// export const unselectTutor = async (req, res) => {
//     const studentId = req.user.id;

//     try {
//         const student = await User.findByPk(studentId);
//         if (!student) return res.status(404).json({ message: 'התלמיד לא נמצא' });

//         const currentTutorId = student.myTutor;

//         if (currentTutorId) {
//             const validationResult = await validateStudentCanDisconnectOrSwitchTutor(studentId, currentTutorId);
//             if (!validationResult.allowed) {
//                 return res.status(validationResult.status).json({ message: validationResult.message });
//             }

//             await Notification.destroy({
//                 where: {
//                     studentId,
//                     tutorId: currentTutorId,
//                     type: NOTIFICATION_TYPES.PENDING_GOALS
//                 }
//             });
//         }

//         student.myTutor = null;

//         await Booking.update(
//             { status: 'cancelled' },
//             {
//                 where: {
//                     studentId: studentId,
//                     tutorId: currentTutorId,
//                     status: ['pending', 'confirmed']
//                 }
//             }
//         );

//         await student.save();

//         res.status(200).json({ message: 'המורה הוסר בהצלחה', user: student });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'שגיאת שרת בהסרת המורה' });
//     }
// };

export const selectTutor = async (req, res) => {
    try {
        const { tutorId } = req.params;
        const studentId = req.user.id;

        const tutor = await Tutor.findByPk(tutorId);
        if (!tutor) return res.status(404).json({ message: 'המורה לא נמצא' });

        const student = await User.findByPk(studentId);
        if (!student) return res.status(404).json({ message: 'התלמיד לא נמצא' });

        const currentTutorId = student.myTutor;

        // 🛑 כאן הייתה חסרה קריאת הוולידציה!
        if (currentTutorId) {
            const validationResult = await validateStudentCanDisconnectOrSwitchTutor(studentId, currentTutorId);
            if (!validationResult.allowed) {
                return res.status(validationResult.status).json({ message: validationResult.message });
            }

            // מחיקת ההתראה אם הוולידציה עברה (או שאין שיעורים חוסמים)
            await Notification.destroy({
                where: {
                    studentId,
                    tutorId: currentTutorId,
                    type: NOTIFICATION_TYPES.PENDING_GOALS
                }
            });
        }

        // 1. ביטול שיעורים עתידיים בלבד מול המורה הישן
        if (currentTutorId) {
            console.log(`[selectTutor] Cancelling future confirmed/pending bookings with old tutor ${currentTutorId}`);
            
            const allBookings = await Booking.findAll({
                where: {
                    studentId: studentId,
                    tutorId: currentTutorId,
                    status: ['pending', 'confirmed']
                }
            });

            const now = new Date();
            for (const booking of allBookings) {
                let lessonDateTime;
                if (typeof booking.lessonDate === 'string' && booking.lessonDate.includes('-')) {
                    const [year, month, day] = booking.lessonDate.split('-').map(Number);
                    const [hours, minutes] = (booking.startTime || '00:00').split(':').map(Number);
                    lessonDateTime = new Date(year, month - 1, day, hours, minutes);
                } else {
                    lessonDateTime = new Date(booking.lessonDate);
                    if (booking.startTime) {
                        const [hours, minutes] = booking.startTime.split(':').map(Number);
                        lessonDateTime.setHours(hours, minutes, 0, 0);
                    }
                }

                if (lessonDateTime.getTime() >= now.getTime()) {
                    booking.status = 'cancelled';
                    await booking.save();
                }
            }
        }

        // 2. עדכון המורה החדש למשתמש
        student.myTutor = tutorId;
        student.studentFields = {
            ...(student.studentFields || {}),
            tutorSelectedAt: new Date()
        };
        student.changed('studentFields', true);

        await student.save();
        console.log(`[selectTutor] Success! Student switched to new tutor ${tutorId}`);
        res.status(200).json({ message: 'המורה נבחר בהצלחה', user: student });
    } catch (error) {
        console.error('[selectTutor] Server error:', error);
        res.status(500).json({ message: 'שגיאת שרת בבחירת המורה' });
    }
};


export const unselectTutor = async (req, res) => {
    const studentId = req.user.id;

    try {
        const student = await User.findByPk(studentId);
        if (!student) return res.status(404).json({ message: 'התלמיד לא נמצא' });

        const currentTutorId = student.myTutor;

        // 🛑 קריאת הוולידציה גם בהסרת מורה!
        if (currentTutorId) {
            const validationResult = await validateStudentCanDisconnectOrSwitchTutor(studentId, currentTutorId);
            if (!validationResult.allowed) {
                return res.status(validationResult.status).json({ message: validationResult.message });
            }

            await Notification.destroy({
                where: {
                    studentId,
                    tutorId: currentTutorId,
                    type: NOTIFICATION_TYPES.PENDING_GOALS
                }
            });
        }

        if (currentTutorId) {
            console.log(`[unselectTutor] Cancelling future confirmed/pending bookings with tutor ${currentTutorId}`);
            
            const allBookings = await Booking.findAll({
                where: {
                    studentId: studentId,
                    tutorId: currentTutorId,
                    status: ['pending', 'confirmed']
                }
            });

            const now = new Date();
            for (const booking of allBookings) {
                let lessonDateTime;
                if (typeof booking.lessonDate === 'string' && booking.lessonDate.includes('-')) {
                    const [year, month, day] = booking.lessonDate.split('-').map(Number);
                    const [hours, minutes] = (booking.startTime || '00:00').split(':').map(Number);
                    lessonDateTime = new Date(year, month - 1, day, hours, minutes);
                } else {
                    lessonDateTime = new Date(booking.lessonDate);
                    if (booking.startTime) {
                        const [hours, minutes] = booking.startTime.split(':').map(Number);
                        lessonDateTime.setHours(hours, minutes, 0, 0);
                    }
                }

                if (lessonDateTime.getTime() >= now.getTime()) {
                    booking.status = 'cancelled';
                    await booking.save();
                }
            }
        }

        student.myTutor = null;

        await student.save();
        console.log(`[unselectTutor] Success! Student disconnected from tutor.`);
        res.status(200).json({ message: 'המורה הוסר בהצלחה', user: student });
    } catch (error) {
        console.error('[unselectTutor] Server error:', error);
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