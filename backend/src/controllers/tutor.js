import { User, Tutor, Booking, Review } from '../models/index.js';
import { Op } from 'sequelize';
import { autoCancelExpiredBookings } from '../utils/bookingUtils.js';



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
            return res.status(404).json({ message: 'פרופיל מורה לא נמצא עבור משתמש זה' });
        }

        const students = await User.findAll({
            where: {
                myTutor: tutor.id,
                role: 'student'
            },
            attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires'] },
            include: [
                {
                    model: Booking,
                    as: 'bookings',
                    where: { tutorId: tutor.id },
                    required: false
                }
            ],
            order: [['firstName', 'ASC']]
        });

        const threeWeeksAgo = new Date();
        threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);

        const inactiveStudents = [];
        const unpaidLessonsStudents = [];

        students.forEach(student => {
            const bookings = student.bookings || [];

            const activeStatuses = ['completed', 'confirmed', 'pending'];
            const hasRecentActivity = bookings.some(booking => {
                const lessonDate = new Date(booking.lessonDate);
                return activeStatuses.includes(booking.status) && lessonDate >= threeWeeksAgo;
            });

            if (!hasRecentActivity) {
                inactiveStudents.add ? inactiveStudents.push(student) : inactiveStudents.push(student);
            }

            const hasUnpaidLessons = bookings.some(booking => booking.isPaid === false && booking.status !== 'cancelled');

            if (hasUnpaidLessons) {
                unpaidLessonsStudents.push(student);
            }
        });

        return res.status(200).json({
            success: true,
            count: students.length,
            students,
            inactiveStudents,
            unpaidLessonsStudents
        });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ message: 'server error' });
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

        await autoCancelExpiredBookings();

        const user = await User.findByPk(userId, {
            attributes: ['firstName', 'lastName', 'email', 'phoneNumber', 'city', 'street', 'profileImage']
        });

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        const todayBookings = await Booking.findAll({
            where: {
                tutorId: tutor.id,
                lessonDate: { [Op.between]: [startOfToday, endOfToday] },
                status: { [Op.in]: ['confirmed', 'pending', 'completed'] }
            },
            order: [['startTime', 'ASC']]
        });

        const todayLessonsCount = todayBookings.filter((b) => ['confirmed', 'completed'].includes(b.status)).length;
        const completedTodayCount = todayBookings.filter(b => b.status === 'completed').length;
        const pendingTodayCount = todayBookings.filter(b => b.status === 'pending').length;
        const todayUniqueStudents = new Set(todayBookings.map(b => b.studentId)).size;

        const now = new Date();
        const currentTimeString = now.toTimeString().split(' ')[0];

        const futureBookings = await Booking.findAll({
            where: {
                tutorId: tutor.id,
                status: 'confirmed',
                lessonDate: { [Op.gte]: startOfToday }
            },
            include: [
                {
                    model: User,
                    as: 'student',
                    include: [{ model: User, attributes: ['firstName', 'lastName'] }]
                }
            ],
            order: [['lessonDate', 'ASC'], ['startTime', 'ASC']]
        });

        const nextBooking = futureBookings.find(b => {
            const bookingDate = new Date(b.lessonDate);
            bookingDate.setHours(0, 0, 0, 0);

            if (bookingDate > startOfToday) {
                return true;
            }

            const lessonEndTime = b.endTime;
            return lessonEndTime > currentTimeString;
        }) || null;

        let studentFullName = '';
        if (nextBooking) {
            const sUser = nextBooking.student?.User || nextBooking.student;
            if (sUser && sUser.firstName) {
                studentFullName = `${sUser.firstName} ${sUser.lastName || ''}`.trim();
            }
        }

        const totalPendingCount = await Booking.count({
            where: { tutorId: tutor.id, status: 'pending' }
        });

        const pendingGoalsBooking = await Booking.findOne({
            where: {
                tutorId: tutor.id,
                status: 'confirmed',
                lessonDate: { [Op.lt]: startOfToday }
            },
            order: [['lessonDate', 'DESC']]
        });

        return res.status(200).json({
            tutor: {
                id: tutor.id,
                userId: tutor.userId,
                carModel: tutor.carModel,
                pricePerLesson: tutor.pricePerLesson,
                lessonDuration: tutor.lessonDuration,
                workStartHour: tutor.workStartHour,
                workEndHour: tutor.workEndHour,
                BufferTime: tutor.BufferTime,
                experienceYears: tutor.experienceYears,
                bio: tutor.bio,
                NotesForStudents: tutor.NotesForStudents,

                firstName: user?.firstName || req.user?.firstName || '',
                lastName: user?.lastName || req.user?.lastName || '',
                profileImage: user?.profileImage || null,

                stats: {
                    todayLessons: todayLessonsCount,
                    completedToday: completedTodayCount,
                    todayPending: pendingTodayCount,
                    todayStudents: todayUniqueStudents,
                    totalPending: totalPendingCount
                },
                nextLesson: nextBooking ? {
                    id: nextBooking.id,
                    studentId: nextBooking.studentId,
                    studentName: studentFullName,
                    pickupLocation: nextBooking.pickupLocation || 'טרם עודכן',
                    startTime: nextBooking.startTime,
                    endTime: nextBooking.endTime,
                    lessonDate: nextBooking.lessonDate,
                    status: nextBooking.status
                } : null,
                urgentAlerts: {
                    hasPendingGoals: !!pendingGoalsBooking,
                    pendingGoalsStudentId: pendingGoalsBooking ? pendingGoalsBooking.studentId : null,
                    totalPendingRequests: totalPendingCount
                },
                systemStatus: {
                    isOnline: true,
                    statusText: 'מערכת תקינה ופעילה'
                }
            }
        });

    } catch (error) {
        console.error("Dashboard Error:", error);
        return res.status(500).json({
            message: "שגיאה בשרת",
            error: error.message
        });
    }
};


export const getTutorWeeklySchedule = async (req, res) => {
    try {
        const tutorId = req.user.tutorId;

        if (!tutorId) {
            return res.status(400).json({ message: 'Tutor ID is missing' });
        }

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const endOfSeventhDay = new Date();
        endOfSeventhDay.setDate(startOfToday.getDate() + 6);
        endOfSeventhDay.setHours(23, 59, 59, 999);

        const rawBookingsCount = await Booking.count({
            where: {
                tutorId: tutorId,
                lessonDate: { [Op.between]: [startOfToday, endOfSeventhDay] },
                status: { [Op.in]: ['pending', 'confirmed', 'completed'] }
            }
        });

        const bookings = await Booking.findAll({
            where: {
                tutorId: tutorId,
                lessonDate: {
                    [Op.between]: [startOfToday, endOfSeventhDay]
                },
                status: {
                    [Op.in]: ['pending', 'confirmed', 'completed']
                }
            },
            include: [
                {
                    model: User,
                    as: 'student',
                    attributes: ['id', 'firstName', 'lastName', 'phoneNumber', 'profileImage', 'city']
                }
            ],
            order: [
                ['lessonDate', 'ASC'],
                ['startTime', 'ASC']
            ]
        });

        const tutorSettings = await Tutor.findByPk(tutorId, {
            attributes: ['workStartHour', 'workEndHour', 'lessonDuration', 'BufferTime']
        });

        return res.status(200).json({
            success: true,
            timeRange: {
                from: startOfToday,
                to: endOfSeventhDay
            },
            tutorSettings,
            bookings
        });

    } catch (error) {
        console.error('error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
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