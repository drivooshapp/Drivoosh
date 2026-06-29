import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';


const User = sequelize.define('User', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    firstName: { type: DataTypes.STRING, allowNull: false, validate: { len: { args: [2, 20] } } },
    lastName: { type: DataTypes.STRING, allowNull: false, validate: { len: { args: [2, 20] } } },
    role: { type: DataTypes.ENUM('student', 'tutor'), allowNull: false },
    email: { type: DataTypes.STRING, unique: true, allowNull: false, validate: { isEmail: true } },
    // password: { type: DataTypes.STRING, allowNull: false, validate: { len: { args: [6, 100], msg: "הסיסמה חייבת לכלול בין 6 ל-12 תווים" } } },
    password: { type: DataTypes.STRING, allowNull: false },

    phoneNumber: { type: DataTypes.STRING, allowNull: true, validate: { is: /^[0-9+\-\s]+$/i } },
    city: { type: DataTypes.STRING, allowNull: true },
    street: { type: DataTypes.STRING, allowNull: true },
    profileImage: { type: DataTypes.STRING, allowNull: true },
    myTutor: { type: DataTypes.UUID, allowNull: true, references: { model: 'Tutors', key: 'id' } },
    isSetupComplete: { type: DataTypes.BOOLEAN, defaultValue: false },
    resetPasswordToken: { type: DataTypes.STRING, allowNull: true },
    resetPasswordExpires: { type: DataTypes.DATE, allowNull: true }
}, {
    timestamps: true
});

export default User;