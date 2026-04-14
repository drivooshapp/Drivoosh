import { Tutor, Booking, User } from '../models/index.js';
import { Op } from 'sequelize';


export const getAllTutors = async (req, res) => {
    try {
        const tutors = await Tutor.findAll({
            include: [{
                model: User,
                attributes: ['firstName', 'lastName', 'profileImage', 'city'] 
            }],
            attributes: [
                'id', 
                'carModel', 
                'gearbox', 
                'pricePerLesson', 
                'experienceYears', 
                'workStartHour', 
                'workEndHour', 
                'bio'
            ]
        });

        res.status(200).json(tutors);

    } catch (error) {
        console.error("DEBUG ERROR:", error);
        res.status(500).json({ message: "שגיאה בשליפת רשימת המורים" });
    }
};


export const getMyProfile = async (req, res) => {
    try {
        const tutorProfile = await Tutor.findOne({
            where: { userId: req.user.id },
            include: [{
                model: User,
                attributes: ['firstName', 'lastName', 'email', 'street', 'city', 'phoneNumber', 'profileImage', 'role']
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


export const getTutorById = async (req, res) => {
    try {
        const { id } = req.params;

        const tutor = await Tutor.findByPk(id, {
            include: [{
                model: User,
                attributes: ['firstName', 'lastName', 'street', 'city', 'phoneNumber', 'profileImage', 'role']
            }]
        });

        if (!tutor) {
            return res.status(404).json({ message: "המורה לא נמצא" });
        }

        res.status(200).json(tutor);

    } catch (error) {
        console.error("Error fetching tutor:", error);
        res.status(500).json({ message: "שגיאה בשליפת נתוני המורה" });
    }
};


export const updateTutorProfile = async (req, res) => {
    try {
        if (req.user.role !== 'tutor') {
            return res.status(403).json({ message: "גישה נדחתה: רק מורים יכולים לעדכן פרטים אלו" });
        }

        const { carModel, gearbox, pricePerLesson, experienceYears, bio } = req.body;

        const tutor = await Tutor.findOne({ where: { userId: req.user.id } });

        if (!tutor) {
            return res.status(404).json({ message: "פרופיל מורה לא נמצא במערכת" });
        }

        await tutor.update({
            carModel,
            gearbox,
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