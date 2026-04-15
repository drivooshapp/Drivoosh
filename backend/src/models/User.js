import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';


const User = sequelize.define('User', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    firstName: { type: DataTypes.STRING, allowNull: false },
    lastName: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM('student', 'tutor'), allowNull: false },
    email: { type: DataTypes.STRING, unique: true, allowNull: false, validate: { isEmail: true } },
    password: { type: DataTypes.STRING, allowNull: false },
    phoneNumber: { type: DataTypes.STRING, allowNull: true, validate: { is: /^[0-9+\-\s]+$/i } },
    city: { type: DataTypes.STRING, allowNull: true },
    street: { type: DataTypes.STRING, allowNull: true },
    profileImage: { type: DataTypes.STRING, allowNull: true },
    myTutor: { type: DataTypes.UUID, allowNull: true, references: { model: 'Tutors', key: 'id' } },
    isSetupComplete: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
    timestamps: true
});

export default User;