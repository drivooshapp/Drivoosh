// import User from './User.js';
// import Tutor from './Tutor.js';
// import Booking from './Booking.js';

// User.hasOne(Tutor, { foreignKey: 'userId', onDelete: 'CASCADE' });
// Tutor.belongsTo(User, { foreignKey: 'userId' });

// Tutor.hasMany(User, { foreignKey: 'tutorId', as: 'students' });
// User.belongsTo(Tutor, { foreignKey: 'tutorId', as: 'myTutor' });

// User.hasMany(Booking, { foreignKey: 'studentId' });
// Booking.belongsTo(User, { as: 'student', foreignKey: 'studentId', targetKey: 'id' });

// Tutor.hasMany(Booking, { foreignKey: 'tutorId' });
// Booking.belongsTo(Tutor, { foreignKey: 'tutorId', targetKey: 'id' });

// export { User, Tutor, Booking };






// import User from './User.js';
// import Tutor from './Tutor.js';
// import Booking from './Booking.js';
// import Review from './Review.js';

// User.hasOne(Tutor, { foreignKey: 'userId', as: 'tutorProfile', onDelete: 'CASCADE' });
// Tutor.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Tutor.hasMany(User, { foreignKey: 'myTutor', as: 'students' });
// User.belongsTo(Tutor, { foreignKey: 'myTutor', as: 'chosenTutor' });

// User.hasMany(Booking, { foreignKey: 'studentId', as: 'bookings' });
// Booking.belongsTo(User, { as: 'student', foreignKey: 'studentId' });

// Tutor.hasMany(Booking, { foreignKey: 'tutorId', as: 'tutorBookings' });
// Booking.belongsTo(Tutor, { foreignKey: 'tutorId', as: 'tutor' });

// Tutor.hasMany(Review, { foreignKey: 'tutorId', as: 'reviews' });
// Review.belongsTo(Tutor, { foreignKey: 'tutorId' });

// User.hasMany(Review, { foreignKey: 'studentId', as: 'myReviews' });
// Review.belongsTo(User, { foreignKey: 'studentId', as: 'student' });

// export { User, Tutor, Booking, Review };

import User from './User.js';
import Tutor from './Tutor.js';
import Booking from './Booking.js';
import Review from './Review.js';

// קשר 1:1 - פרופיל משתמש ומורה
User.hasOne(Tutor, { foreignKey: 'userId', as: 'tutorProfile', onDelete: 'CASCADE' });
Tutor.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// קשר 1:N - תלמידים ששייכים למורה מסוים
Tutor.hasMany(User, { foreignKey: 'myTutor', as: 'students' });
User.belongsTo(Tutor, { foreignKey: 'myTutor', as: 'chosenTutor' });

// קשר 1:N - הזמנות (Bookings)
User.hasMany(Booking, { foreignKey: 'studentId', as: 'bookings' });
Booking.belongsTo(User, { foreignKey: 'studentId', as: 'student' });

Tutor.hasMany(Booking, { foreignKey: 'tutorId', as: 'tutorBookings' });
Booking.belongsTo(Tutor, { foreignKey: 'tutorId', as: 'tutor' });

// קשר 1:N - המלצות (Reviews)
Tutor.hasMany(Review, { foreignKey: 'tutorId', as: 'reviews' });
Review.belongsTo(Tutor, { foreignKey: 'tutorId', as: 'tutor' });

User.hasMany(Review, { foreignKey: 'studentId', as: 'myReviews' });
Review.belongsTo(User, { foreignKey: 'studentId', as: 'reviewer' }); // שימוש ב-'reviewer' ככינוי עקבי

export { User, Tutor, Booking, Review };