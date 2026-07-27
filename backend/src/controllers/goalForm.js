import StudentFormHeader from '../models/goalForm/StudentFormHeader.js';
import StudentGoalProgress from '../models/goalForm/StudentGoalProgress.js';
import LessonGoal from '../models/goalForm/LessonGoal.js';
import { officialMinistryGoals } from '../models/goalForm/officialGoals.js';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';


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

        return res.status(200).json({
            header,
            progress: formattedProgress
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
//         if (!progress) return res.status(404).json({ message: 'סעיף זה לא נמצא' });

//         if (isChecked !== undefined) progress.isChecked = isChecked;
//         if (rating !== undefined) progress.rating = rating;
//         if (notes !== undefined) progress.notes = notes;

//         await progress.save();
//         return res.status(200).json({ message: 'עודכן בהצלחה', progress });
//     } catch (error) {
//         return res.status(500).json({ message: 'שגיאה בעדכון ההתקדמות' });
//     }
// };


// export const updateGoalProgress = async (req, res) => {
//     const { studentId, goalId, isChecked, rating, notes } = req.body;
//     try {
//         const progress = await StudentGoalProgress.findOne({ where: { studentId, goalId } });
//         if (!progress) return res.status(404).json({ message: 'סעיף זה לא נמצא' });

//         const totalLessonsCount = await Booking.count({ where: { studentId } });

//         if (totalLessonsCount === 0) {
//             return res.status(400).json({
//                 message: 'צריך לעבור לפחות שיעור אחד קודם עדכון המטרה'
//             });
//         }

//         const now = new Date();
//         const currentDate = now.toISOString().split("T")[0];
//         const currentTime = now.toTimeString().substring(0, 5);

//         let targetLesson = await Booking.findOne({
//             where: {
//                 studentId,
//                 status: 'confirmed',
//                 [Op.or]: [
//                     { lessonDate: { [Op.lt]: currentDate } },
//                     {
//                         lessonDate: currentDate,
//                         endTime: { [Op.lt]: currentTime }
//                     }
//                 ]
//             },
//             order: [['lessonDate', 'ASC'], ['startTime', 'ASC']]
//         });

//         if (!targetLesson) {
//             targetLesson = await Booking.findOne({
//                 where: {
//                     studentId,
//                     status: 'completed'
//                 },
//                 order: [['lessonDate', 'DESC'], ['startTime', 'DESC']]
//             });
//         }

//         if (!targetLesson) {
//             return res.status(400).json({
//                 message: 'לא נמצאו שיעורים עבור תלמיד זה'
//             });
//         }

//         progress.lessonId = targetLesson.id;


//         if (isChecked !== undefined) progress.isChecked = isChecked;
//         if (rating !== undefined) progress.rating = rating;
//         if (notes !== undefined) progress.notes = notes;

//         await progress.save();

//         if (targetLesson.status === 'confirmed') {
//             await targetLesson.update({ status: 'completed' });
//         }

//         return res.status(200).json({ message: 'עודכן בהצלחה', progress });
//     } catch (error) {
//         console.error("Error updating goal progress:", error);
//         return res.status(500).json({ message: 'שגיאה בעדכון ההתקדמות' });
//     }
// };

export const updateGoalProgress = async (req, res) => {
    const { studentId, goalId, isChecked, rating, notes } = req.body;
    try {
        console.log(`--- [updateGoalProgress START] --- studentId: ${studentId}, goalId: ${goalId}`);

        const progress = await StudentGoalProgress.findOne({ where: { studentId, goalId } });
        if (!progress) {
            console.log('Progress not found for studentId & goalId');
            return res.status(404).json({ message: 'סעיף זה לא נמצא' });
        }

        const totalLessonsCount = await Booking.count({ where: { studentId } });
        console.log(`Total lessons count for student: ${totalLessonsCount}`);

        if (totalLessonsCount === 0) {
            return res.status(400).json({ 
                message: 'צריך לעבור לפחות שיעור אחד קודם עדכון המטרה' 
            });
        }

        const now = new Date();
        const currentDate = now.toISOString().split("T")[0];
        const currentTime = now.toTimeString().substring(0, 5);
        console.log(`Current system check -> Date: ${currentDate}, Time: ${currentTime}`);

        // חיפוש שיעור confirmed שעבר
        let targetLesson = await Booking.findOne({
            where: { 
                studentId,
                status: 'confirmed',
                [Op.or]: [
                    { lessonDate: { [Op.lt]: currentDate } },
                    {
                        lessonDate: currentDate,
                        endTime: { [Op.lt]: currentTime }
                    }
                ]
            },
            order: [['lessonDate', 'ASC'], ['startTime', 'ASC']]
        });

        if (targetLesson) {
            console.log('Found an expired CONFIRMED lesson:', targetLesson.toJSON());
        } else {
            console.log('No expired CONFIRMED lesson found. Searching for the last COMPLETED lesson...');
            targetLesson = await Booking.findOne({
                where: { 
                    studentId,
                    status: 'completed'
                },
                order: [['lessonDate', 'DESC'], ['startTime', 'DESC']]
            });

            if (targetLesson) {
                console.log('Found last COMPLETED lesson:', targetLesson.toJSON());
            }
        }

        if (!targetLesson) {
            console.log('No suitable lesson found at all for this student.');
            return res.status(400).json({ 
                message: 'לא נמצאו שיעורים עבור תלמיד זה' 
            });
        }

        console.log(`Selected targetLesson ID for progress: ${targetLesson.id} with status: ${targetLesson.status}`);

        progress.lessonId = targetLesson.id;

        if (isChecked !== undefined) progress.isChecked = isChecked;
        if (rating !== undefined) progress.rating = rating;
        if (notes !== undefined) progress.notes = notes;

        await progress.save();
        console.log('Progress saved successfully.');

        // בדיקה האם הסטטוס היה confirmed וצריך לעדכן ל-completed
        console.log(`Checking if status update is needed. Current targetLesson status is: "${targetLesson.status}"`);
        if (targetLesson.status === 'confirmed') {
            console.log(`Updating lesson ${targetLesson.id} status from 'confirmed' to 'completed'...`);
            await targetLesson.update({ status: 'completed' });
            console.log('Lesson status updated successfully to completed.');
        } else {
            console.log('Lesson status was NOT updated because it was not in "confirmed" status.');
        }

        console.log('--- [updateGoalProgress END SUCCESS] ---');
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