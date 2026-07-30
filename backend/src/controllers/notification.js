import Notification from "../models/Notification.js";



export const getTutorNotifications = async (req, res) => {
    try {
        const tutorId = req.user.tutorId;

        const notifications = await Notification.findAll({
            where: { tutorId },
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json({
            success: true,
            count: notifications.length,
            notifications
        });

    } catch (error) {
        console.error('Error fetching tutor notifications:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'שגיאת שרת בשליפת ההתראות של המורה' 
        });
    }
};