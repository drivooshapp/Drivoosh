import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';


const User = sequelize.define('User', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    firstName: { type: DataTypes.STRING, allowNull: false },
    lastName: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, unique: true, allowNull: false, validate: { isEmail: true } },
    password: { type: DataTypes.STRING },
    phoneNumber: { type: DataTypes.STRING, allowNull: true, validate: { is: /^[0-9+\-\s]+$/i } },
    role: { type: DataTypes.ENUM('student', 'tutor'), allowNull: false },
    profileImage: { type: DataTypes.STRING },
    isSetupComplete: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
    timestamps: true
});

export default User;