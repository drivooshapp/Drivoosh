import { Booking, Tutor, User } from '../models/index.js';
import { Op } from 'sequelize';


export const createBooking = async (req, res) => {
    try {
        const { tutorId, dateTime, pickupLocation, duration } = req.body;
        const studentId = req.user.id;

        const tutor = await Tutor.findByPk(tutorId);
        if (!tutor) return res.status(404).json({ message: "המורה לא נמצא" });

        const newBooking = await Booking.create({
            studentId,
            tutorId,
            dateTime,
            pickupLocation,
            duration: duration || 40,
            priceAtBooking: tutor.pricePerLesson,
            status: 'pending'
        });

        res.status(201).json({ message: "בקשת שיעור נשלחה למורה", booking: newBooking });

    } catch (error) {
        res.status(500).json({ message: "שגיאה ביצירת הזמנה" });
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
                { model: User, as: 'student', attributes: ['firstName', 'lastName', 'phoneNumber'] },
                { 
                    model: Tutor, 
                    include: [{ model: User, attributes: ['firstName', 'lastName'] }] 
                }
            ],
            order: [['dateTime', 'ASC']]
        });

        res.status(200).json(bookings);
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "שגיאה בשליפת הזמנות" });
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

        if (!booking) return res.status(404).json({ message: "הזמנה לא נמצאה" });

        booking.status = 'canceled';
        await booking.save();

        res.status(200).json({ message: "השיעור בוטל בהצלחה" });
    } catch (error) {
        res.status(500).json({ message: "שגיאה בביטול השיעור" });
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