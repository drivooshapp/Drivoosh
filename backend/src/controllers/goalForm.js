import StudentFormHeader from '../models/goalForm/StudentFormHeader.js';
import StudentGoalProgress from '../models/goalForm/StudentGoalProgress.js';
import LessonGoal from '../models/goalForm/LessonGoal.js';
import Booking from '../models/Booking.js';
import Notification, { NOTIFICATION_STATUS, NOTIFICATION_TYPES } from '../models/Notification.js';
import { officialMinistryGoals } from '../models/goalForm/officialGoals.js';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { Op } from "sequelize";



export const getStudentGoalsForm = async (req, res) => {
    try {
        const { studentId } = req.params;

        let allGoals = await LessonGoal.findAll();

        if (allGoals.length === 0) {
            await LessonGoal.bulkCreate(officialMinistryGoals);

            allGoals = await LessonGoal.findAll();
        }

        let progress = await StudentGoalProgress.findAll({
            where: { studentId },
            include: [{ model: LessonGoal, as: 'goalDetails' }]
        });

        if (progress.length === 0) {
            const progressToCreate = allGoals.map(goal => ({
                studentId,
                goalId: goal.id,
                rating: 0,
                notes: '',
                isChecked: false
            }));

            await StudentGoalProgress.bulkCreate(progressToCreate);

            progress = await StudentGoalProgress.findAll({
                where: { studentId },
                include: [{ model: LessonGoal, as: 'goalDetails' }]
            });
        }

        let header = await StudentFormHeader.findOne({ where: { studentId } });
        if (!header) {
            header = await StudentFormHeader.create({ studentId });
        }

        const formattedProgress = progress.map(item => {
            const plainItem = item.get({ plain: true });
            if (plainItem.goalDetails && plainItem.goalDetails.stage) {
                plainItem.goalDetails.stage = plainItem.goalDetails.stage.toUpperCase();
            }
            return plainItem;
        });

        const totalGoalsCount = allGoals.length;
        const completedGoalsCount = formattedProgress.filter(item => item.isChecked).length;
        const progressPercentage = totalGoalsCount > 0 ? Math.round((completedGoalsCount / totalGoalsCount) * 100) : 0;

        return res.status(200).json({
            header,
            progress: formattedProgress,
            stats: {
                completedGoalsCount,
                totalGoalsCount,
                progressPercentage
            }
        });

    } catch (error) {
        console.error("error:", error);
        return res.status(500).json({ message: 'שגיאה בשרת בשליפת נתוני הטופס' });
    }
};


// export const updateGoalProgress = async (req, res) => {
//     const { studentId, goalId, isChecked, rating, notes } = req.body;

//     try {
//         const progress = await StudentGoalProgress.findOne({ where: { studentId, goalId } });
//         if (!progress) {
//             return res.status(404).json({ message: 'סעיף זה לא נמצא' });
//         }

//         if (!progress.lessonId) {
//             const totalLessonsCount = await Booking.count({ where: { studentId } });

//             if (totalLessonsCount === 0) {
//                 return res.status(400).json({
//                     message: 'צריך לעבור לפחות שיעור אחד קודם עדכון המטרה'
//                 });
//             }

//             const now = new Date();
//             const currentDate = now.toISOString().split("T")[0];
//             const currentTime = now.toTimeString().substring(0, 5);

//             let targetLesson = await Booking.findOne({
//                 where: {
//                     studentId,
//                     status: 'confirmed',
//                     [Op.or]: [
//                         { lessonDate: { [Op.lt]: currentDate } },
//                         {
//                             lessonDate: currentDate,
//                             endTime: { [Op.lt]: currentTime }
//                         }
//                     ]
//                 },
//                 order: [['lessonDate', 'ASC'], ['startTime', 'ASC']]
//             });

//             if (!targetLesson) {
//                 targetLesson = await Booking.findOne({
//                     where: {
//                         studentId,
//                         status: 'completed'
//                     },
//                     order: [['lessonDate', 'DESC'], ['startTime', 'DESC']]
//                 });
//             }

//             if (!targetLesson) {
//                 return res.status(400).json({ message: 'לא נמצאו שיעורים עבור תלמיד זה' });
//             }

//             progress.lessonId = targetLesson.id;

//             if (targetLesson.status === 'confirmed') {
//                 await targetLesson.update({ status: 'completed' });
//             }
//         }

//         if (isChecked !== undefined) progress.isChecked = isChecked;
//         if (rating !== undefined) progress.rating = rating;
//         if (notes !== undefined) progress.notes = notes;

//         await progress.save();

//         const allStudentLessons = await Booking.findAll({
//             where: { studentId },
//             attributes: ['id', 'status', 'lessonDate']
//         });

//         // if (allStudentLessons.length > 0) {
//         //     console.log("hhhhhh")
//         //     const lessonIds = allStudentLessons.map(lesson => lesson.id);

//         //     const linkedProgressRecords = await StudentGoalProgress.findAll({
//         //         where: { studentId },
//         //         attributes: ['lessonId']
//         //     });

//         //     const linkedLessonIds = new Set(linkedProgressRecords.map(p => p.lessonId).filter(Boolean));

//         //     const hasUnlinkedLessons = lessonIds.some(lessonId => !linkedLessonIds.has(lessonId));

//         //     if (!hasUnlinkedLessons) {
//         //         await Notification.update(
//         //             { status: NOTIFICATION_STATUS.RESOLVED },
//         //             {
//         //                 where: {
//         //                     studentId,
//         //                     type: NOTIFICATION_TYPES.PENDING_LESSON_FORM,
//         //                     status: NOTIFICATION_STATUS.PENDING
//         //                 }
//         //             }
//         //         );
//         //     }
//         // }

//         if (allStudentLessons.length > 0) {
//             console.log("hhhhhh");

//             // הדפסת הסטטוסים הגולמיים כדי לוודא שהם כבר לא undefined
//             console.log("[DEBUG] Raw lesson statuses:", allStudentLessons.map(l => ({ id: l.id, status: l.status })));

//             // סינון שיעורים שהסטטוס שלהם הוא completed
//             const completedLessons = allStudentLessons.filter(l => {
//                 const statusVal = typeof l.status === 'object' && l.status !== null ? l.status.value : l.status;
//                 return String(statusVal).toLowerCase() === 'completed';
//             });

//             const completedLessonIds = completedLessons.map(l => l.id);

//             console.log(`[DEBUG] Total lessons found: ${allStudentLessons.length}`);
//             console.log(`[DEBUG] Completed lessons count: ${completedLessonIds.length}`);

//             const linkedProgressRecords = await StudentGoalProgress.findAll({
//                 where: { studentId },
//                 attributes: ['lessonId']
//             });

//             const linkedLessonIds = new Set(linkedProgressRecords.map(p => p.lessonId).filter(Boolean));
//             console.log(`[DEBUG] Linked progress records count: ${linkedLessonIds.size}`);

//             const unlinkedCompletedLessons = completedLessonIds.filter(id => !linkedLessonIds.has(id));

//             // עדכון רק אם יש לפחות שיעור אחד שהושלם ואין שום שיעור שדורש טופס וטרם קושר
//             if (completedLessonIds.length > 0 && unlinkedCompletedLessons.length === 0) {
//                 console.log(`[SUCCESS] All ${completedLessonIds.length} completed lessons have progress records. Updating notification to RESOLVED.`);

//                 const [updatedRows] = await Notification.update(
//                     { status: NOTIFICATION_STATUS.RESOLVED },
//                     {
//                         where: {
//                             studentId,
//                             type: NOTIFICATION_TYPES.PENDING_LESSON_FORM,
//                             status: NOTIFICATION_STATUS.PENDING
//                         }
//                     }
//                 );
//                 console.log(`[DEBUG] Notification update result: ${updatedRows} rows updated.`);
//             } else {
//                 console.log(`[WARNING] Cannot resolve notification. Completed: ${completedLessonIds.length}, Unlinked: ${unlinkedCompletedLessons.length}`);
//             }
//         }

//         return res.status(200).json({ message: 'עודכן בהצלחה', progress });

//     } catch (error) {
//         console.error("Error in updateGoalProgress:", error);
//         return res.status(500).json({ message: 'שגיאה בעדכון ההתקדמות' });
//     }
// };

export const updateGoalProgress = async (req, res) => {
    const { studentId, goalId, isChecked, rating, notes } = req.body;

    try {
        const progress = await StudentGoalProgress.findOne({ where: { studentId, goalId } });
        if (!progress) {
            return res.status(404).json({ message: 'סעיף זה לא נמצא' });
        }

        if (!progress.lessonId) {
            const totalLessonsCount = await Booking.count({ where: { studentId } });

            if (totalLessonsCount === 0) {
                return res.status(400).json({
                    message: 'צריך לעבור לפחות שיעור אחד קודם עדכון המטרה'
                });
            }

            const now = new Date();
            const currentDate = now.toISOString().split("T")[0];
            const currentTime = now.toTimeString().substring(0, 5);

            const eligibleLessons = await Booking.findAll({
                where: {
                    studentId,
                    [Op.or]: [
                        { status: 'completed' },
                        { status: 'confirmed', lessonDate: { [Op.lt]: currentDate } },
                        { status: 'confirmed', lessonDate: currentDate, endTime: { [Op.lt]: currentTime } }
                    ]
                },
                order: [['lessonDate', 'ASC'], ['startTime', 'ASC']]
            });

            if (eligibleLessons.length === 0) {
                return res.status(400).json({ message: 'לא נמצאו שיעורים שעברו עבור תלמיד זה' });
            }

            const existingProgressRecords = await StudentGoalProgress.findAll({
                where: { studentId },
                attributes: ['lessonId']
            });
            const assignedLessonIds = new Set(existingProgressRecords.map(p => p.lessonId).filter(Boolean));

            let targetLesson = eligibleLessons.find(l => !assignedLessonIds.has(l.id));

            if (!targetLesson) {
                targetLesson = eligibleLessons[eligibleLessons.length - 1];
            }

            progress.lessonId = targetLesson.id;

            if (targetLesson.status === 'confirmed') {
                await targetLesson.update({ status: 'completed' });
            }
        }

        if (isChecked !== undefined) progress.isChecked = isChecked;
        if (rating !== undefined) progress.rating = rating;
        if (notes !== undefined) progress.notes = notes;

        await progress.save();

        const allStudentLessons = await Booking.findAll({
            where: { studentId },
            attributes: ['id', 'status', 'lessonDate']
        });

        if (allStudentLessons.length > 0) {
            const completedLessons = allStudentLessons.filter(l => {
                const statusVal = typeof l.status === 'object' && l.status !== null ? l.status.value : l.status;
                return String(statusVal).toLowerCase() === 'completed';
            });

            const completedLessonIds = completedLessons.map(l => l.id);

            const linkedProgressRecords = await StudentGoalProgress.findAll({
                where: { studentId },
                attributes: ['goalId', 'lessonId']
            });

            const linkedLessonIds = new Set(linkedProgressRecords.map(p => p.lessonId).filter(Boolean));

            const unlinkedCompletedLessons = completedLessonIds.filter(id => !linkedLessonIds.has(id));

            if (completedLessonIds.length > 0 && unlinkedCompletedLessons.length === 0) {
                const [updatedRows] = await Notification.update(
                    { status: NOTIFICATION_STATUS.RESOLVED },
                    {
                        where: {
                            studentId,
                            type: NOTIFICATION_TYPES.PENDING_LESSON_FORM,
                            status: NOTIFICATION_STATUS.PENDING
                        }
                    }
                );
            }
        }

        return res.status(200).json({ message: 'עודכן בהצלחה', progress });

    } catch (error) {
        console.error("Error in updateGoalProgress:", error);
        return res.status(500).json({ message: 'שגיאה בעדכון ההתקדמות' });
    }
};


export const updateFormHeader = async (req, res) => {
    const { studentId, fields } = req.body;
    try {
        const header = await StudentFormHeader.findOne({ where: { studentId } });
        if (!header) return res.status(404).json({ message: 'הטופס לא נמצא' });

        await header.update(fields);
        return res.status(200).json({ message: 'פרטי הכותרת עודכנו בהצלחה', header });
    } catch (error) {
        return res.status(500).json({ message: 'שגיאה בעדכון כותרת הטופס' });
    }
};


export const exportFormToPDF = async (req, res) => {
    const { studentId } = req.params;
    try {
        const header = await StudentFormHeader.findOne({ where: { studentId } });
        const progress = await StudentGoalProgress.findAll({
            where: { studentId },
            include: [{ model: LessonGoal, as: 'goalDetails' }]
        });

        if (!header) return res.status(404).json({ message: 'הטופס לא נמצא' });

        const templatePath = path.join(__dirname, '../assets/goals_form_template.pdf');
        if (!fs.existsSync(templatePath)) {
            return res.status(500).json({ message: 'קובץ תבנית PDF חסר בשרת' });
        }

        const templateBuffer = fs.readFileSync(templatePath);
        const pdfDoc = await PDFDocument.load(templateBuffer);

        const pages = pdfDoc.getPages();
        const firstPage = pages[0];

        if (header.schoolNameAndNum) {
            firstPage.drawText(header.schoolNameAndNum, {
                x: 450,
                y: 710,
                size: 11,
            });
        }

        progress.forEach((p) => {
            if (p.isChecked) {
                // סימון V או X בתיבת הבחירה המתאימה לו ב-PDF[cite: 1]
            }
        });

        const pdfBytes = await pdfDoc.save();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=goals_form_${studentId}.pdf`);

        return res.status(200).send(Buffer.from(pdfBytes));

    } catch (error) {
        console.error('Error creating PDF:', error);
        return res.status(500).json({ message: 'שגיאה בייצוא קובץ ה-PDF' });
    }
};