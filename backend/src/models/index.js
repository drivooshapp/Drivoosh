import User from './User.js';
import Tutor from './Tutor.js';
import { TutorNote } from './Tutor.js';
import Booking from './Booking.js';
import Review from './Review.js';
import StudentFormHeader from '../models/goalForm/StudentFormHeader.js';
import StudentGoalProgress from '../models/goalForm/StudentGoalProgress.js';
import LessonGoal from '../models/goalForm/LessonGoal.js';
import Notification from './Notification.js';


User.hasOne(Tutor, { foreignKey: 'userId', as: 'tutorProfile', onDelete: 'CASCADE' });
Tutor.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Tutor.hasMany(User, { foreignKey: 'myTutor', as: 'students' });
User.belongsTo(Tutor, { foreignKey: 'myTutor', as: 'chosenTutor' });

Tutor.hasMany(TutorNote, { foreignKey: 'tutorId', as: 'notes', onDelete: 'CASCADE' });
TutorNote.belongsTo(Tutor, { foreignKey: 'tutorId', as: 'tutor' });

User.hasMany(Booking, { foreignKey: 'studentId', as: 'bookings' });
Booking.belongsTo(User, { foreignKey: 'studentId', as: 'student' });

Tutor.hasMany(Booking, { foreignKey: 'tutorId', as: 'tutorBookings' });
Booking.belongsTo(Tutor, { foreignKey: 'tutorId', as: 'tutor' });

Tutor.hasMany(Review, { foreignKey: 'tutorId', as: 'reviews' });
Review.belongsTo(Tutor, { foreignKey: 'tutorId', as: 'tutor' });

User.hasMany(Review, { foreignKey: 'studentId', as: 'myReviews' });
Review.belongsTo(User, { foreignKey: 'studentId', as: 'reviewer' });

User.hasOne(StudentFormHeader, { foreignKey: 'studentId', as: 'formHeader', onDelete: 'CASCADE' });
StudentFormHeader.belongsTo(User, { foreignKey: 'studentId', as: 'student' });

User.hasMany(StudentGoalProgress, { foreignKey: 'studentId', as: 'goalsProgress', onDelete: 'CASCADE' });
StudentGoalProgress.belongsTo(User, { foreignKey: 'studentId', as: 'student' });

LessonGoal.hasMany(StudentGoalProgress, { foreignKey: 'goalId', as: 'progressRecords', onDelete: 'CASCADE' });
StudentGoalProgress.belongsTo(LessonGoal, { foreignKey: 'goalId', as: 'goalDetails' });

Tutor.hasMany(Notification, { foreignKey: 'tutorId', as: 'notifications', onDelete: 'CASCADE' });
Notification.belongsTo(Tutor, { foreignKey: 'tutorId', as: 'tutor' });

User.hasMany(Notification, { foreignKey: 'studentId', as: 'studentNotifications', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'studentId', as: 'student' });


export { User, Tutor, TutorNote, Booking, Review, StudentFormHeader, StudentGoalProgress, LessonGoal, Notification };