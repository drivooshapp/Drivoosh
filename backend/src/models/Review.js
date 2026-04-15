// import { DataTypes } from 'sequelize';
// import sequelize from '../config/db.js';


// const Review = sequelize.define('Review', {
//     id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
//     studentId: { type: DataTypes.UUID, allowNull: false },
//     tutorId: { type: DataTypes.UUID, allowNull: false },
//     content: { type: DataTypes.TEXT, allowNull: false },
//     rating: { type: DataTypes.INTEGER, validate: { min: 1, max: 5 } }
// }, {
//     timestamps: true
// });

// export default Review;

import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Review = sequelize.define('Review', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    studentId: { type: DataTypes.UUID, allowNull: false, references: { model: 'Users', key: 'id' } },
    tutorId: { type: DataTypes.UUID, allowNull: false, references: { model: 'Tutors', key: 'id' } },
    content: { type: DataTypes.TEXT, allowNull: false },
    rating: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 5 } }
}, {
    timestamps: true
});

export default Review;