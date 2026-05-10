import { Booking, Tutor, User } from '../models/index.js';
import { Op } from 'sequelize';


export const createBooking = async (req, res) => {
    try {
        const { lessonDate, startTime, tutorId, pickupLocation, notes } = req.body;
        const studentId = req.user?.id;

        const tutor = await Tutor.findByPk(tutorId);
        if (!tutor) {
            return res.status(404).json({ message: "המורה לא נמצא" });
        }

        const BUFFER_TIME = tutor.BufferTime || 15;
        const lessonDuration = tutor.lessonDuration || 45;
        const timeParts = startTime.split(':');

        if (timeParts.length !== 2) {
            return res.status(400).json({ message: "פורמט שעה לא תקין" });
        }

        const [hours, minutes] = timeParts.map(Number);
        const startTotalMinutes = hours * 60 + minutes;
        const endTotalMinutes = startTotalMinutes + lessonDuration;

        const endH = Math.floor(endTotalMinutes / 60);
        const endM = endTotalMinutes % 60;
        const endTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;

        const startOfDay = new Date(`${lessonDate}T00:00:00.000Z`);
        const endOfDay = new Date(`${lessonDate}T23:59:59.999Z`);

        const overlappingBookings = await Booking.findAll({
            where: {
                tutorId,
                lessonDate: { [Op.between]: [startOfDay, endOfDay] },
                status: { [Op.ne]: 'cancelled' }
            }
        });

        const isTaken = overlappingBookings.some(b => {
            const [bStartH, bStartM] = b.startTime.split(':').map(Number);
            const [bEndH, bEndM] = b.endTime.split(':').map(Number);

            const bStartMinutes = bStartH * 60 + bStartM;
            const bEndWithBuffer = (bEndH * 60 + bEndM) + BUFFER_TIME;

            return startTotalMinutes < bEndWithBuffer && (startTotalMinutes + lessonDuration) > bStartMinutes;
        });

        if (isTaken) {
            return res.status(400).json({ message: "השעה שנבחרה אינה פנויה" });
        }

        const newBooking = await Booking.create({
            studentId,
            tutorId,
            lessonDate,
            pickupLocation,
            startTime,
            endTime,
            notes: notes || "",
            priceAtBooking: tutor.pricePerLesson || 0,
            status: 'pending'
        });

        return res.status(201).json({
            message: "בקשת השיעור נשלחה למורה בהצלחה",
            booking: newBooking
        });

    } catch (error) {
        console.error("SERVER ERROR:", error);
        return res.status(500).json({ message: "שגיאה ביצירת ההזמנה", details: error.message });
    }
};


export const getAvailableSlots = async (req, res) => {
    try {
        const { tutorId } = req.params;
        const { date } = req.query;

        const tutor = await Tutor.findByPk(tutorId);
        if (!tutor) return res.status(404).json({ message: "המורה לא נמצא" });

        const BUFFER_TIME = Number(tutor.BufferTime || 0);
        const lessonDuration = Number(tutor.lessonDuration);

        const now = new Date();

        const todayStr = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Jerusalem',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(now);

        const israelTimeStr = now.toLocaleTimeString('en-GB', {
            timeZone: 'Asia/Jerusalem',
            hour12: false,
            hour: '2-digit',
            minute: '2-digit'
        });
        const [currH, currM] = israelTimeStr.split(':').map(Number);
        const currentTotalMinutes = currH * 60 + currM;

        const startOfDay = new Date(`${date}T00:00:00.000Z`);
        const endOfDay = new Date(`${date}T23:59:59.999Z`);

        const existingBookings = await Booking.findAll({
            where: {
                tutorId,
                lessonDate: { [Op.between]: [startOfDay, endOfDay] },
                status: { [Op.ne]: 'cancelled' }
            },
            attributes: ['startTime', 'endTime']
        });

        const busyRanges = existingBookings.map(b => {
            const [startH, startM] = b.startTime.split(':').map(Number);
            const [endH, endM] = b.endTime.split(':').map(Number);

            return {
                start: startH * 60 + startM,
                end: (endH * 60 + endM) + BUFFER_TIME
            };
        });

        const startH = parseInt((tutor.workStartHour || "08:00").split(':')[0]);
        const endH = parseInt((tutor.workEndHour || "20:00").split(':')[0]);

        const allPossibleSlots = [];
        const step = 15;

        for (let totalMin = startH * 60; totalMin + lessonDuration <= endH * 60; totalMin += step) {
            const h = Math.floor(totalMin / 60).toString().padStart(2, '0');
            const m = (totalMin % 60).toString().padStart(2, '0');
            allPossibleSlots.push(`${h}:${m}`);
        }

        const availableSlots = allPossibleSlots.filter(slot => {
            const [h, m] = slot.split(':').map(Number);
            const slotStartMinutes = h * 60 + m;
            const slotEndMinutes = slotStartMinutes + lessonDuration;

            const isOverlap = busyRanges.some(range => {
                return slotStartMinutes < range.end && slotEndMinutes > range.start;
            });

            if (isOverlap) return false;

            if (date === todayStr) {
                if (slotStartMinutes <= currentTotalMinutes + 5) return false;
            }

            return true;
        });

        res.status(200).json(availableSlots);

    } catch (error) {
        console.error("CRITICAL SERVER ERROR:", error);
        res.status(500).json({ message: "שגיאה בחישוב שעות", error: error.message });
    }
};


export const getMyBookings = async (req, res) => {
    try {
        const { id, role } = req.user;
        let whereCondition = {};

        if (role === 'tutor') {
            const tutor = await Tutor.findOne({ where: { userId: id } });
            if (!tutor) return res.status(404).json({ message: "פרופיל מורה לא נמצא" });

            whereCondition = {
                tutorId: tutor.id,
                status: { [Op.ne]: 'canceled' }
            };
        } else {
            whereCondition = { studentId: id };
        }

        const bookings = await Booking.findAll({
            where: whereCondition,
            include: [
                {
                    model: User,
                    as: 'student',
                    attributes: ['firstName', 'lastName', 'phoneNumber']
                },
                {
                    model: Tutor,
                    as: 'tutor',
                    include: [{
                        model: User,
                        as: 'user',
                        attributes: ['firstName', 'lastName', 'profileImage']
                    }]
                }
            ],
            order: [['lessonDate', 'ASC']]
        });

        res.status(200).json(bookings);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "שגיאה בשליפת הזמנות" });
    }
};


export const getBookingById = async (req, res) => {
    try {
        const { bookingId } = req.params;

        const booking = await Booking.findByPk(bookingId, {
            include: [
                {
                    model: User,
                    as: 'student',
                    attributes: ['firstName', 'lastName', 'phoneNumber', 'email', 'profileImage']
                },
                {
                    model: Tutor,
                    as: 'tutor',
                    include: [{
                        model: User,
                        as: 'user',
                        attributes: ['firstName', 'lastName', 'profileImage', 'phoneNumber']
                    }]
                }
            ]
        });

        if (!booking) {
            return res.status(404).json({ message: "השיעור לא נמצא" });
        }

        if (booking.studentId !== req.user.id && booking.tutor.userId !== req.user.id) {
            return res.status(403).json({ message: "אין לך הרשאה לצפות בשיעור זה" });
        }

        res.status(200).json(booking);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "שגיאה בשליפת פרטי השיעור" });
    }
};


export const updateBookingStatus = async (req, res) => {
    try {
        const { bookingId, status } = req.body;
        const tutorId = req.user.id;

        const booking = await Booking.findOne({ where: { id: bookingId, tutorId } });

        if (!booking) return res.status(404).json({ message: "הזמנה לא נמצאה" });

        booking.status = status;

        await booking.save();

        res.status(200).json({ message: `הסטטוס עודכן ל-${status}`, booking });

    } catch (error) {
        res.status(500).json({ message: "שגיאה בעדכון הסטטוס" });
    }
};


// export const cancelBooking = async (req, res) => {
//     try {
//         const { bookingId } = req.params;
//         const studentId = req.user.id;

//         const booking = await Booking.findOne({ where: { id: bookingId, studentId } });

//         if (!booking) return res.status(404).json({ message: "הזמנה לא נמצאה" });

//         const now = new Date();
//         const lessonDate = new Date(`${booking.lessonDate.split('T')[0]}T${booking.startTime}`);
//         const hoursLeft = (lessonDate - now) / (1000 * 60 * 60);

//         if (hoursLeft < 24) {
//             return res.status(400).json({
//                 message: "ביטול פחות מ-24 שעות לפני השיעור דורש תיאום טלפוני מול המורה"
//             });
//         }

//         booking.status = 'cancelled';

//         await booking.save();

//         res.status(200).json({ message: "השיעור בוטל בהצלחה" });
//     } catch (error) {
//         res.status(500).json({ message: "שגיאה בביטול השיעור" });
//     }
// };
export const cancelBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const studentId = req.user.id;

        console.log(`[CancelBooking] מנסה לבטל שיעור ID: ${bookingId} עבור סטודנט: ${studentId}`);

        const booking = await Booking.findOne({ where: { id: bookingId, studentId } });

        if (!booking) {
            console.log(`[CancelBooking] שגיאה: הזמנה ${bookingId} לא נמצאה בבסיס הנתונים`);
            return res.status(404).json({ message: "הזמנה לא נמצאה" });
        }

        console.log(`[CancelBooking] נמצאה הזמנה. תאריך: ${booking.lessonDate}, שעה: ${booking.startTime}`);

        try {
            const now = new Date();
            // const datePart = booking.lessonDate.split('T')[0];
            const lessonDateObj = new Date(booking.lessonDate);
            const datePart = lessonDateObj.toISOString().split('T')[0];
            const lessonDate = new Date(`${datePart}T${booking.startTime}`);

            const hoursLeft = (lessonDate - now) / (1000 * 60 * 60);

            console.log(`[CancelBooking] שעות שנותרו עד לשיעור: ${hoursLeft.toFixed(2)}`);

            if (hoursLeft < 24) {
                return res.status(400).json({
                    message: "ביטול פחות מ-24 שעות לפני השיעור דורש תיאום טלפוני מול המורה"
                });
            }
        } catch (dateError) {
            console.error(`[CancelBooking] שגיאה בעיבוד התאריך:`, dateError);
            throw new Error("שגיאה בחישוב הזמן לביטול");
        }

        booking.status = 'cancelled';
        await booking.save();

        console.log(`[CancelBooking] השיעור בוטל בהצלחה ב-DB`);
        res.status(200).json({ message: "השיעור בוטל בהצלחה" });

    } catch (error) {
        // הלוג החשוב ביותר - מדפיס את השגיאה המלאה לטרמינל של השרת
        console.error("--- ERROR IN CANCEL_BOOKING ---");
        console.error("Message:", error.message);
        console.error("Stack Trace:", error.stack);
        console.error("-------------------------------");

        res.status(500).json({
            message: "שגיאה בביטול השיעור",
            error: error.message // אופציונלי: להחזיר את הודעת השגיאה גם לקליינט בזמן פיתוח
        });
    }
};

export const completeBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const tutorId = req.user.id;

        const booking = await Booking.findOne({ where: { id: bookingId, tutorId } });

        if (!booking) return res.status(404).json({ message: "הזמנה לא נמצאה" });

        booking.status = 'completed';

        await booking.save();

        res.status(200).json({ message: "השיעור סומן כבוצע בהצלחה" });

    } catch (error) {
        res.status(500).json({ message: "שגיאה בעדכון סיום שיעור" });
    }
};