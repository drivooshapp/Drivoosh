import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';


const Tutor = sequelize.define('Tutor', {
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true
    },
    carModel: { type: DataTypes.STRING },
    gearbox: { type: DataTypes.ENUM('manual', 'automatic') },
    pricePerLesson: { type: DataTypes.INTEGER },
    experienceYears: { type: DataTypes.INTEGER },
    bio: { type: DataTypes.TEXT }
});

export default Tutor;