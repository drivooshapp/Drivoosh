import { User, Tutor, Booking, Review } from '../models/index.js';
import { Op } from 'sequelize';



export const getAllTutors = async (req, res) => {
    try {
        const tutors = await Tutor.findAll({
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['firstName', 'lastName', 'profileImage', 'city']
                },
                {
                    model: Review,
                    as: 'reviews',
                    attributes: ['id', 'content', 'rating', 'createdAt'],
                    include: [{
                        model: User,
                        as: 'reviewer',
                        attributes: ['firstName', 'lastName', 'profileImage']
                    }]
                }
            ],
            attributes: [
                'id',
                'carModel',
                'pricePerLesson',
                'experienceYears',
                'workStartHour',
                'workEndHour',
                'bio'
            ],
            order: [['experienceYears', 'DESC']]
        });

        res.status(200).json(tutors);

    } catch (error) {
        console.error("שגיאה בשליפת מורים:", error.message);
        res.status(500).json({
            message: "שגיאה בשליפת רשימת המורים",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};


export const getAllMyStudents = async (req, res) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ message: 'משתמש לא נמצא' });
        }

        const tutor = await Tutor.findOne({ where: { userId } });

        if (!tutor) {
            return res.status(44, 404).json({ message: 'פרופיל מורה לא נמצא עבור משתמש זה' });
        }

        const students = await User.findAll({
            where: {
                myTutor: tutor.id,
                role: 'student'
            },
            attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires'] },
            order: [['firstName', 'ASC']]
        });

        return res.status(200).json({
            success: true,
            count: students.length,
            students
        });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ message: 'שגיאת שרת פנימית בעת שליפת התלמידים' });
    }
};


export const getTutorById = async (req, res) => {
    try {
        const { id } = req.params;

        const tutor = await Tutor.findByPk(id, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['firstName', 'lastName', 'street', 'city', 'phoneNumber', 'profileImage']
                },
                {
                    model: Review,
                    as: 'reviews',
                    include: [{
                        model: User,
                        as: 'reviewer',
                        attributes: ['firstName', 'lastName', 'profileImage']
                    }]
                }
            ],
            attributes: [
                'id', 'carModel', 'pricePerLesson',
                'experienceYears', 'workStartHour', 'workEndHour',
                'BufferTime', 'lessonDuration', 'bio'
            ]
        });

        if (!tutor) {
            return res.status(404).json({ message: "המורה לא נמצא" });
        }

        res.status(200).json(tutor);

    } catch (error) {
        console.error("שגיאה בשליפת נתוני מורה:", error.message);
        res.status(500).json({ message: "שגיאה בשרת" });
    }
};


export const getMyProfile = async (req, res) => {
    try {
        const tutorProfile = await Tutor.findOne({
            where: { userId: req.user.id },
            include: [{
                model: User,
                as: 'user',
                attributes: ['firstName', 'lastName', 'identityNumber', 'email', 'street', 'city', 'phoneNumber', 'profileImage', 'role']
            }]
        });

        if (!tutorProfile) {
            return res.status(404).json({ message: "פרופיל מורה לא נמצא" });
        }

        res.status(200).json(tutorProfile);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "שגיאה בשליפת פרופיל המורה" });
    }
};


export const updateTutorProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const {
            firstName, lastName, identityNumber, phoneNumber, city, street, profileImage, // שדות של User
            carModel, pricePerLesson, lessonDuration, experienceYears, bio, BufferTime, workStartHour, workEndHour // שדות של Tutor
        } = req.body;

        await User.update(
            { firstName, lastName, identityNumber, phoneNumber, city, street, profileImage },
            { where: { id: userId } }
        );

        await Tutor.update(
            { carModel, pricePerLesson, lessonDuration, experienceYears, bio, BufferTime, workStartHour, workEndHour },
            { where: { userId: userId } }
        );

        const updatedProfile = await Tutor.findOne({
            where: { userId },
            include: [{ model: User, as: 'user' }]
        });

        res.status(200).json({
            message: "פרופיל המורה עודכן בהצלחה!",
            tutor: updatedProfile
        });

        console.log("updatedProfile: ", updatedProfile)

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "שגיאה בעדכון הפרופיל" });
    }
};


export const getTutorDashboardData = async (req, res) => {
    try {
        const userId = req.user.id;

        const tutor = await Tutor.findOne({ where: { userId } });
        if (!tutor) {
            return res.status(404).json({ message: "פרופיל מורה לא נמצא" });
        }

        const pendingLessonsCount = await Booking.count({
            where: {
                tutorId: tutor.id,
                status: 'pending'
            }
        });

        const upcomingLessonsCount = await Booking.count({
            where: {
                tutorId: tutor.id,
                status: 'confirmed',
                dateTime: { [Op.gte]: new Date() }
            }
        });

        const totalUniqueStudents = await Booking.count({
            distinct: true,
            col: 'studentId',
            where: { tutorId: tutor.id }
        });

        res.status(200).json({
            tutorId: tutor.id,
            stats: {
                pendingLessons: pendingLessonsCount,
                upcomingLessons: upcomingLessonsCount,
                totalStudents: totalUniqueStudents,
            }
        });

    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        res.status(500).json({ message: "שגיאה בשליפת נתוני לוח הבקרה" });
    }
};


export const getAllMyHistory = async (req, res) => {
    try {
        const tutorId = req.user.tutorId;

        const historyBookings = await Booking.findAll({
            where: {
                tutorId: tutorId,
                status: {
                    [Op.in]: ['completed', 'cancelled']
                }
            },
            include: [
                {
                    model: User,
                    as: 'student',
                    attributes: ['id', 'firstName', 'lastName', 'profileImage', 'phoneNumber']
                }
            ],
            order: [
                ['lessonDate', 'DESC'],
                ['startTime', 'DESC']
            ]
        });

        return res.status(200).json({
            success: true,
            count: historyBookings.length,
            history: historyBookings
        });

    } catch (error) {
        console.error('Error fetching tutor history:', error);
        return res.status(500).json({
            success: false,
            message: 'שגיאת שרת בהבאת היסטוריית השיעורים'
        });
    }
};