import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/db.js';

export class LessonGoal extends Model { }

LessonGoal.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  stage: { type: DataTypes.ENUM('A', 'B', 'C', 'D'), allowNull: false },
  chapter: { type: DataTypes.STRING, allowNull: false },
  goalNumber: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false }
}, {
  sequelize, tableName: 'lesson_goals', timestamps: false
});

export default LessonGoal;