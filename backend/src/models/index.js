// import User from './User.js';
// import Tutor from './Tutor.js';
// import Booking from './Booking.js';


// User.hasOne(Tutor, { foreignKey: 'userId', onDelete: 'CASCADE' });
// Tutor.belongsTo(User, { foreignKey: 'userId' });

// User.hasMany(Booking, { foreignKey: 'studentId' });
// Booking.belongsTo(User, { as: 'student', foreignKey: 'studentId' });

// Tutor.hasMany(Booking, { foreignKey: 'tutorId' });
// Booking.belongsTo(Tutor, { foreignKey: 'tutorId' });

// export { User, Tutor, Booking };

import User from './User.js';
import Tutor from './Tutor.js';
import Booking from './Booking.js';

User.hasOne(Tutor, { foreignKey: 'userId', onDelete: 'CASCADE' });
Tutor.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Booking, { foreignKey: 'studentId' });
Booking.belongsTo(User, { 
    as: 'student', 
    foreignKey: 'studentId',
    targetKey: 'id'
});

Tutor.hasMany(Booking, { foreignKey: 'tutorId' });
Booking.belongsTo(Tutor, { 
    foreignKey: 'tutorId',
    targetKey: 'id' 
});

export { User, Tutor, Booking };