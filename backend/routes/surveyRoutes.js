import express from 'express';
import Survey from '../models/Survey.js';
import Response from '../models/Response.js'; // ✅ Import added
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Create a new survey
// @route   POST /api/surveys
// @access  Private (Creator)
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, questions } = req.body;

    const survey = new Survey({
      title,
      description,
      questions,
      creator: req.user._id,
    });

    const createdSurvey = await survey.save();
    res.status(201).json(createdSurvey);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating survey' });
  }
});

// @desc    Get all surveys for a creator
// @route   GET /api/surveys
// @access  Private (Creator)
router.get('/', protect, async (req, res) => {
  try {
    const surveys = await Survey.find({ creator: req.user._id }).sort({ createdAt: -1 });
    res.json(surveys);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching surveys' });
  }
});

// @desc    Get a single survey by ID
// @route   GET /api/surveys/:id
// @access  Private (Creator)
router.get('/:id', protect, async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);

    if (survey && survey.creator.toString() === req.user._id.toString()) {
      res.json(survey);
    } else if (survey) {
      res.status(403).json({ message: 'Not authorized to view this survey' });
    } else {
      res.status(404).json({ message: 'Survey not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching survey' });
  }
});

// @desc    Update survey details
// @route   PUT /api/surveys/:id
// @access  Private (Creator)
router.put('/:id', protect, async (req, res) => {
  try {
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
  } catch (error) {
    res.status(500).json({ message: 'Error updating survey' });
  }
});

// @desc    Delete a survey and its associated responses
// @route   DELETE /api/surveys/:id
// @access  Private (Creator)
router.delete('/:id', protect, async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);

    if (survey && survey.creator.toString() === req.user._id.toString()) {
      // ✅ Delete all responses linked to this survey
      await Response.deleteMany({ survey: req.params.id });

      // ✅ Delete the survey itself
      await Survey.deleteOne({ _id: req.params.id });

      res.json({ message: 'Survey and all associated responses removed successfully' });
    } else if (survey) {
      res.status(403).json({ message: 'Not authorized to delete this survey' });
    } else {
      res.status(404).json({ message: 'Survey not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting survey data' });
  }
});

export default router;
