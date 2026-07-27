import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/db.js'
import LessonGoal from './LessonGoal.js';

export class StudentGoalProgress extends Model { }

StudentGoalProgress.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  studentId: { type: DataTypes.UUID, allowNull: false },
  // lessonId: { type: DataTypes.UUID, allowNull: true },
  goalId: { type: DataTypes.UUID, allowNull: false, references: { model: LessonGoal, key: 'id' } },
  isChecked: { type: DataTypes.BOOLEAN, defaultValue: false },
  rating: { type: DataTypes.INTEGER, defaultValue: 1 },
  notes: { type: DataTypes.TEXT, allowNull: true }
}, {
  sequelize,
  tableName: 'student_goal_progress',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['studentId', 'goalId'], name: 'idx_student_goal' }
  ]
});

// StudentGoalProgress.belongsTo(LessonGoal, { foreignKey: 'goalId', as: 'goalDetails' });

export default StudentGoalProgress;