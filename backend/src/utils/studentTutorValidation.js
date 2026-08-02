import Booking from '../models/Booking.js';
import Notification, { NOTIFICATION_TYPES } from '../models/Notification.js';
import User from '../models/User.js';


export const validateStudentCanDisconnectOrSwitchTutor = async (studentId, tutorId) => {
    const bookings = await Booking.findAll({
        where: { studentId, tutorId }
    });

    const now = new Date();

    let hasPastConfirmed = false;

    bookings.forEach(b => {
        if (b.status !== 'confirmed') return;

        let lessonDateTime;

        if (typeof b.lessonDate === 'string' && b.lessonDate.includes('-')) {
            const [year, month, day] = b.lessonDate.split('-').map(Number);
            const [hours, minutes] = (b.startTime || '00:00').split(':').map(Number);
            lessonDateTime = new Date(year, month - 1, day, hours, minutes);
        } else {
            lessonDateTime = new Date(b.lessonDate);
            if (b.startTime) {
                const [hours, minutes] = b.startTime.split(':').map(Number);
                lessonDateTime.setHours(hours, minutes, 0, 0);
            }
        }

        if (lessonDateTime.getTime() < now.getTime()) {
            hasPastConfirmed = true;
        }
    });

    if (hasPastConfirmed) {
        const existingNotification = await Notification.findOne({
            where: {
                studentId,
                tutorId,
                type: NOTIFICATION_TYPES.PENDING_GOALS
            }
        });

        if (!existingNotification) {
            const studentUser = await User.findByPk(studentId);
            const studentFullName = studentUser ? `${studentUser.firstName} ${studentUser.lastName}` : 'התלמיד';

            await Notification.create({
                tutorId,
                studentId,
                content: `לידיעתך, ${studentFullName} ביקש/ה לעזוב את מסגרת הלימודים או להחליף מורה. קיימים שיעורים קודמים המחייבים השלמת טופס מטרות טרם השלמת התהליך.`,
                type: NOTIFICATION_TYPES.PENDING_GOALS
            });
        }

        return {
            allowed: false,
            status: 400,
            message: 'לא ניתן לבצע את הפעולה עקב שיעורים קודמים הממתינים להשלמת טופס מטרות.\n\nנשלחה התראה למורה. מומלץ ליצור עמו קשר טלפוני להשלמת התהליך.'
        };
    }

    return { allowed: true };
};