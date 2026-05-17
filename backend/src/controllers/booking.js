import { Booking, Tutor, User } from '../models/index.js';
import { Op } from 'sequelize';


const calculateEndTime = (startTime, durationMinutes) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endH = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
    const endM = (totalMinutes % 60).toString().padStart(2, '0');
    return `${endH}:${endM}`;
};

export const createBooking = async (req, res) => {
    try {
        const { lessonDate, startTime, tutorId, pickupLocation, notes } = req.body;
        const studentId = req.user?.id;

        console.log(`[New Booking Attempt] Student: ${studentId}, Tutor: ${tutorId}, Date: ${lessonDate}, Time: ${startTime}`);

        const tutor = await Tutor.findByPk(tutorId);
        if (!tutor) {
            return res.status(404).json({ message: "המורה לא נמצא" });
        }

        const BUFFER_TIME = Number(tutor.BufferTime || 15);
        const lessonDuration = Number(tutor.lessonDuration || 45);
        const timeParts = startTime.split(':');

        if (timeParts.length !== 2) {
            console.log(`[Error] Invalid time format received: ${startTime}`);
            return res.status(400).json({ message: "פורמט שעה לא תקין" });
        }

        const [hours, minutes] = timeParts.map(Number);
        const startTotalMinutes = hours * 60 + minutes;
        const endTotalMinutes = startTotalMinutes + lessonDuration;

        const startOfDay = new Date(`${lessonDate}T00:00:00`);
        const endOfDay = new Date(`${lessonDate}T23:59:59`);

        const overlappingBookings = await Booking.findAll({
            where: {
                tutorId,
                lessonDate: { [Op.between]: [startOfDay, endOfDay] },
                status: { [Op.ne]: 'cancelled' }
            }
        });

        console.log(`[Debug] Checking against ${overlappingBookings.length} existing bookings on ${lessonDate}`);

        const isTaken = overlappingBookings.some(b => {
            const [bStartH, bStartM] = b.startTime.split(':').map(Number);
            const [bEndH, bEndM] = b.endTime.split(':').map(Number);

            const bStartMinutes = bStartH * 60 + bStartM;
            const bEndMinutes = bEndH * 60 + bEndM;
            
            const bEndWithBuffer = bEndMinutes + BUFFER_TIME;
            
            const overlap = startTotalMinutes < bEndWithBuffer && endTotalMinutes > bStartMinutes;
            
            if (overlap) {
                console.log(`[Conflict Found] Request: ${startTime}, Conflict with: ${b.startTime}-${b.endTime} (Buffer ends at ${bEndWithBuffer}min)`);
            }
            return overlap;
        });

        if (isTaken) {
            console.log(`[Blocked] Booking rejected: Time slot ${startTime} is occupied or within buffer.`);
            return res.status(400).json({ message: "השעה שנבחרה אינה פנויה (חופפת לשיעור קיים או לזמן הפסקה)" });
        }

        const finalEndTime = calculateEndTime(startTime, lessonDuration);
        
        const newBooking = await Booking.create({
            studentId,
            tutorId,
            lessonDate,
            pickupLocation,
            startTime,
            endTime: finalEndTime,
            notes: notes || "",
            priceAtBooking: tutor.pricePerLesson || 0,
            status: 'pending'
        });

        console.log(`[Success] Booking created ID: ${newBooking.id}`);

        return res.status(201).json({
            message: "בקשת השיעור נשלחה למורה בהצלחה",
            booking: newBooking 
        });

    } catch (error) {
        console.error("SERVER ERROR IN createBooking:", error);
        return res.status(500).json({ 
            message: "שגיאה פנימית בשרת בעת יצירת ההזמנה", 
            details: error.message 
        });
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


export const cancelBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const studentId = req.user.id;

        const booking = await Booking.findOne({ where: { id: bookingId, studentId } });

        if (!booking) {
            return res.status(404).json({ message: "הזמנה לא נמצאה" });
        }

        try {
            const now = new Date();

            const lessonDateObj = new Date(booking.lessonDate);
            const datePart = lessonDateObj.toISOString().split('T')[0];

            const lessonFullDateTime = new Date(`${datePart}T${booking.startTime}`);

            const hoursLeft = (lessonFullDateTime - now) / (1000 * 60 * 60);

            if (hoursLeft < 24) {
                return res.status(400).json({
                    message: "ביטול פחות מ-24 שעות לפני השיעור דורש תיאום טלפוני מול המורה"
                });
            }
        } catch (dateError) {
            throw new Error("שגיאה בחישוב הזמן לביטול - ודא פורמט תאריך ושעה תקינים");
        }

        booking.status = 'cancelled';
        await booking.save();

        res.status(200).json({ message: "השיעור בוטל בהצלחה" });

    } catch (error) {
        res.status(500).json({ message: "שגיאה בביטול השיעור", error: error.message });
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