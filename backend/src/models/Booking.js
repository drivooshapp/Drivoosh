import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';


const Booking = sequelize.define('Booking', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    lessonDate: { type: DataTypes.DATE, allowNull: false },
    duration: { type: DataTypes.INTEGER, defaultValue: 45 },
    pickupLocation: { type: DataTypes.STRING, allowNull: false },
    status: { type: DataTypes.ENUM('pending', 'confirmed', 'completed', 'cancelled'), defaultValue: 'pending' },
    priceAtBooking: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    notes: { type: DataTypes.TEXT }
});

export default Booking;