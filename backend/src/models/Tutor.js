import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';


const Tutor = sequelize.define('Tutor', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false, unique: true },
    carModel: { type: DataTypes.STRING },
    gearbox: { type: DataTypes.ENUM('manual', 'automatic') },
    pricePerLesson: { type: DataTypes.INTEGER },
    lessonDuration: { type: DataTypes.INTEGER },
    workStartHour: { type: DataTypes.STRING, defaultValue: "08:00" },
    workEndHour: { type: DataTypes.STRING, defaultValue: "20:00" },
    experienceYears: { type: DataTypes.INTEGER },
    bio: { type: DataTypes.TEXT }
});

export default Tutor;