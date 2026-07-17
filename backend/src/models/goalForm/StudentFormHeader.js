import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/db.js'

export class StudentFormHeader extends Model {}

StudentFormHeader.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  studentId: { type: DataTypes.UUID, allowNull: false, unique: true },
  tutorId: { type: DataTypes.UUID, allowNull: false },
  schoolNameAndNum: { type: DataTypes.STRING, allowNull: true },
  teacherVehicleNum: { type: DataTypes.STRING, allowNull: true },
  licenseGrade: { type: DataTypes.STRING, defaultValue: 'B' },
  
  medicalDeclarationDate: { type: DataTypes.DATEONLY, allowNull: true },
  eyeTestDate: { type: DataTypes.DATEONLY, allowNull: true },
  theoryTestDate: { type: DataTypes.DATEONLY, allowNull: true },
  startLearningDate: { type: DataTypes.DATEONLY, allowNull: true },

  signedStageA_ChapterA: { type: DataTypes.BOOLEAN, defaultValue: false },
  signedStageA_ChapterB: { type: DataTypes.BOOLEAN, defaultValue: false },
  signedStageA_ChapterC: { type: DataTypes.BOOLEAN, defaultValue: false },
  signedStageB_ChapterA: { type: DataTypes.BOOLEAN, defaultValue: false },
  signedStageB_ChapterB: { type: DataTypes.BOOLEAN, defaultValue: false },
  signedStageB_ChapterC: { type: DataTypes.BOOLEAN, defaultValue: false },
  signedStageC_ChapterA: { type: DataTypes.BOOLEAN, defaultValue: false },
  signedStageC_ChapterB: { type: DataTypes.BOOLEAN, defaultValue: false },
  signedStageD_ChapterA: { type: DataTypes.BOOLEAN, defaultValue: false },
  signedStageD_ChapterB: { type: DataTypes.BOOLEAN, defaultValue: false },

  totalLessonsCount: { type: DataTypes.INTEGER, allowNull: true },
  totalLessonsOtherTutor: { type: DataTypes.INTEGER, defaultValue: 0 },
  isTutorApproved: { type: DataTypes.BOOLEAN, defaultValue: false },
  tutorApprovedAt: { type: DataTypes.DATE, allowNull: true }
}, {
  sequelize,
  tableName: 'student_form_headers',
  timestamps: true
});

export default StudentFormHeader;