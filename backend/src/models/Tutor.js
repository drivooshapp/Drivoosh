import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';


const BUFFER_OPTIONS = ['0', '5', '10', '15', '20', '25', '30', '45', '60'];

const Tutor = sequelize.define('Tutor', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false, unique: true },
    carModel: { type: DataTypes.STRING, allowNull: true },
    // gearbox: { type: DataTypes.ENUM('manual', 'automatic') },
    pricePerLesson: { type: DataTypes.INTEGER, allowNull: true },
    lessonDuration: { type: DataTypes.INTEGER, defaultValue: 45, allowNull: true },
    workStartHour: { type: DataTypes.STRING, defaultValue: "08:00", allowNull: true },
    workEndHour: { type: DataTypes.STRING, defaultValue: "20:00", allowNull: true },
    // BufferTime: {
    //     type: DataTypes.ENUM(...BUFFER_OPTIONS),
    //     defaultValue: '15',
    //     allowNull: true,
    //     validate: { isIn: [BUFFER_OPTIONS] }
    // },
    BufferTime: {
        type: DataTypes.ENUM(...BUFFER_OPTIONS),
        defaultValue: 15,
        allowNull: true,
        validate: {
            min: 0,
            max: 60
        }
    },
    experienceYears: { type: DataTypes.INTEGER, allowNull: true },
    bio: { type: DataTypes.TEXT, allowNull: true }
});

export default Tutor;