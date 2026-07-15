import { Review, Tutor, User } from '../models/index.js';



export const addReview = async (req, res) => {
    try {
        const { tutorId, content, rating } = req.body;
        const studentId = req.user.id;

        if (!tutorId || !content || !rating) {
            return res.status(400).json({ message: "כל השדות חובה" });
        }

        const tutor = await Tutor.findByPk(tutorId);

        if (!tutor) {
            return res.status(404).json({ message: "המורה לא נמצא" });
        }

        const existingReview = await Review.findOne({ where: { studentId, tutorId } });
        if (existingReview) {
            return res.status(409).json({ message: "כבר הוספת המלצה למורה זה" });
        }

        const newReview = await Review.create({
            studentId,
            tutorId,
            content,
            rating
        });

        const reviewWithData = await Review.findByPk(newReview.id, {
            include: [{
                model: User,
                as: 'reviewer',
                attributes: ['firstName', 'lastName', 'profileImage']
            }]
        });

        res.status(201).json(reviewWithData);

    } catch (error) {
        console.error("Error adding review:", error);
        res.status(500).json({ message: "שגיאה בהוספת ההמלצה" });
    }
};


export const deleteReviewContent = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const tutorId = req.user.tutorId;

        const review = await Review.findByPk(reviewId, {
            include: [{
                model: Tutor,
                as: 'tutor'
            }]
        });

        if (!review) {
            return res.status(404).json({ message: "ההמלצה לא נמצאה" });
        }

        review.content = "";
        await review.save();

        res.status(200).json({ message: "תוכן ההמלצה נמחק בהצלחה", review });
    } catch (error) {
        console.log("error", error);
        res.status(500).json({ message: "שגיאה במחיקת ההמלצה" });
    }
};


export const getTutorReviews = async (req, res) => {
    try {
        const tutorId = req.user.tutorId;

        const tutorExists = await Tutor.findByPk(tutorId);
        if (!tutorExists) {
            return res.status(404).json({ message: "מורה לא נמצא" });
        }

        const reviews = await Review.findAll({
            where: { tutorId },
            include: [{
                model: User,
                as: 'reviewer',
                attributes: ['firstName', 'lastName', 'profileImage']
            }],
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json(reviews);

    } catch (error) {
        console.error("Error fetching reviews:", error);
        res.status(500).json({ message: "שגיאה בשליפת ההמלצות" });
    }
};