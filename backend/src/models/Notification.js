import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';


// export const NOTIFICATION_TYPES = {
//     GENERAL: 'GENERAL',
//     PENDING_GOALS: 'PENDING_GOALS'
// };
export const NOTIFICATION_TYPES = {
    GENERAL: 'GENERAL',
    PENDING_LESSON_FORM: 'PENDING_LESSON_FORM',
    STUDENT_QUIT_PENDING_GOALS: 'STUDENT_QUIT_PENDING_GOALS'
};

export const NOTIFICATION_STATUS = {
    PENDING: 'pending',
    RESOLVED: 'resolved'
};

const Notification = sequelize.define('Notification', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tutorId: { type: DataTypes.UUID, allowNull: false },
    studentId: { type: DataTypes.UUID, allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: true },
    type: { type: DataTypes.ENUM(Object.values(NOTIFICATION_TYPES)), allowNull: false, defaultValue: NOTIFICATION_TYPES.GENERAL },
    status: { type: DataTypes.ENUM(Object.values(NOTIFICATION_STATUS)), allowNull: false, defaultValue: NOTIFICATION_STATUS.PENDING }
}, {
    timestamps: true
});

export default Notification;