import { Tutor, Booking, User, Review } from '../models/index.js';
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
        if (req.user.role !== 'tutor') {
            return res.status(403).json({ message: "גישה נדחתה: רק מורים יכולים לעדכן פרטים אלו" });
        }

        const { firstName, lastName, identityNumber, phoneNumber, city, street, carModel, gearbox, pricePerLesson, lessonDuration, workStartHour, workEndHour, BufferTime, experienceYears, bio } = req.body;

        const tutor = await Tutor.findOne({ where: { userId: req.user.id } });

        if (!tutor) {
            return res.status(404).json({ message: "פרופיל מורה לא נמצא במערכת" });
        }
        // צריך לעדכן פה את הפרטים הבסיסיים של המורה כמו שם טלפון וכו
        await tutor.update({
            carModel,
            pricePerLesson,
            experienceYears,
            bio
        });

        res.status(200).json({
            message: "פרופיל המורה עודכן בהצלחה!",
            tutor
        });

    } catch (error) {
        console.error("Update Tutor Error:", error);
        res.status(500).json({ message: "שגיאה בעדכון נתוני המורה" });
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