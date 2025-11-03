import express from 'express';
import Survey from '../models/Survey.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Create a new survey
// @route   POST /api/surveys
// @access  Private (Creator)
router.post('/', protect, async (req, res) => {
    const { title, description, questions } = req.body;

    const survey = new Survey({
        title,
        description,
        questions,
        creator: req.user._id, // Set the creator from the authenticated user
    });

    const createdSurvey = await survey.save();
    res.status(201).json(createdSurvey);
});

// @desc    Get all surveys for a creator
// @route   GET /api/surveys
// @access  Private (Creator)
router.get('/', protect, async (req, res) => {
    const surveys = await Survey.find({ creator: req.user._id }).sort({ createdAt: -1 });
    res.json(surveys);
});

// @desc    Get a single survey by ID (for editing/details)
// @route   GET /api/surveys/:id
// @access  Private (Creator)
router.get('/:id', protect, async (req, res) => {
    const survey = await Survey.findById(req.params.id);

    if (survey && survey.creator.toString() === req.user._id.toString()) {
        res.json(survey);
    } else if (survey) {
        res.status(403).json({ message: 'Not authorized to view this survey' });
    } else {
        res.status(404).json({ message: 'Survey not found' });
    }
});

// @desc    Update survey details (e.g., publish status, questions)
// @route   PUT /api/surveys/:id
// @access  Private (Creator)
router.put('/:id', protect, async (req, res) => {
    const survey = await Survey.findById(req.params.id);

    if (survey && survey.creator.toString() === req.user._id.toString()) {
        const { title, description, questions, isPublished } = req.body;

        survey.title = title || survey.title;
        survey.description = description || survey.description;
        survey.questions = questions || survey.questions;
        survey.isPublished = isPublished !== undefined ? isPublished : survey.isPublished;

        const updatedSurvey = await survey.save();
        res.json(updatedSurvey);
    } else if (survey) {
        res.status(403).json({ message: 'Not authorized to update this survey' });
    } else {
        res.status(404).json({ message: 'Survey not found' });
    }
});

export default router;
