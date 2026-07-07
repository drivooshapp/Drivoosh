import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';



const Tutor = sequelize.define('Tutor', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false, unique: true },
    carModel: { type: DataTypes.STRING, allowNull: true },
    pricePerLesson: { type: DataTypes.INTEGER, allowNull: true },
    lessonDuration: { type: DataTypes.INTEGER, defaultValue: 45, allowNull: true },
    workStartHour: { type: DataTypes.STRING, defaultValue: "08:00", allowNull: true },
    workEndHour: { type: DataTypes.STRING, defaultValue: "20:00", allowNull: true },
    BufferTime: { type: DataTypes.INTEGER, defaultValue: 15, allowNull: true },

    experienceYears: { type: DataTypes.INTEGER, allowNull: true },
    bio: { type: DataTypes.TEXT, allowNull: true }
});

export default Tutor;