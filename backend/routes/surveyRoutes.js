import express from 'express';
import Survey from '../models/Survey.js';
import Response from '../models/Response.js';
import { protect } from '../middleware/authMiddleware.js';
import { sendNewSurveyEmail } from '../utils/emailService.js';

const router = express.Router();

/* ===========================================================
   CREATE NEW SURVEY
   POST /api/surveys (Private)
=========================================================== */
router.post('/', protect, async (req, res) => {
    const { title, description, questions } = req.body;

    const survey = new Survey({
        title,
        description,
        questions,
        creator: req.user._id,
    });

    const createdSurvey = await survey.save();

    // Email notification
    sendNewSurveyEmail(req.user.email, createdSurvey.title);

    res.status(201).json(createdSurvey);
});

/* ===========================================================
   GET ALL SURVEYS FOR CREATOR
   GET /api/surveys (Private)
=========================================================== */
router.get('/', protect, async (req, res) => {
    try {
        const surveys = await Survey.find({ creator: req.user._id })
            .sort({ createdAt: -1 });
        res.json(surveys);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching surveys' });
    }
});

/* ===========================================================
   GET SURVEY BY ID
   GET /api/surveys/:id (Private)
=========================================================== */
router.get('/:id', protect, async (req, res) => {
    try {
        const survey = await Survey.findById(req.params.id);

        if (!survey) {
            return res.status(404).json({ message: 'Survey not found' });
        }

        if (survey.creator.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.json(survey);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching survey' });
    }
});

/* ===========================================================
   UPDATE SURVEY (TITLE, DESC, QUESTIONS, PUBLISH, SHARE)
   PUT /api/surveys/:id (Private)
=========================================================== */
router.put('/:id', protect, async (req, res) => {
    try {
        const survey = await Survey.findById(req.params.id);

        if (!survey) {
            return res.status(404).json({ message: 'Survey not found' });
        }

        if (survey.creator.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { title, description, questions, isPublished, isShareable } = req.body;

        if (title) survey.title = title;
        if (description) survey.description = description;
        if (questions) survey.questions = questions;
        if (isPublished !== undefined) survey.isPublished = isPublished;
        if (isShareable !== undefined) survey.isShareable = isShareable;

        const updatedSurvey = await survey.save();
        res.json(updatedSurvey);

    } catch (error) {
        res.status(500).json({ message: 'Error updating survey' });
    }
});

/* ===========================================================
   ⭐ NEW: UPDATE ONLY SHARE SETTING
   PUT /api/surveys/share/:id  (Private)
=========================================================== */
router.put("/share/:id", protect, async (req, res) => {
    const { isShareable } = req.body;
    const survey = await Survey.findById(req.params.id);

    if (!survey) return res.status(404).json({ message: "Not found" });
    if (survey.creator.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Not authorized" });
    }

    survey.isShareable = isShareable;
    await survey.save();
    res.json({ message: "Share status updated", isShareable });
});


/* ===========================================================
   DELETE SURVEY + ALL RESPONSES
   DELETE /api/surveys/:id  (Private)
=========================================================== */
router.delete('/:id', protect, async (req, res) => {
    try {
        const survey = await Survey.findById(req.params.id);

        if (!survey) {
            return res.status(404).json({ message: 'Survey not found' });
        }

        if (survey.creator.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this survey' });
        }

        await Response.deleteMany({ survey: req.params.id });
        await Survey.deleteOne({ _id: req.params.id });

        res.json({ message: 'Survey and all responses deleted successfully' });

    } catch (error) {
        res.status(500).json({ message: 'Error deleting survey' });
    }
});

export default router;
