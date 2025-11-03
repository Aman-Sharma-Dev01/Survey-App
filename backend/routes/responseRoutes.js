import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getPublicSurvey, submitResponse, getSurveyAnalysis } from '../controllers/responseController.js';

const router = express.Router();

// @desc    Get a public survey definition (for respondents to view/fill)
// @route   GET /api/responses/public/:surveyId
// @access  Public (Respondent)
router.get('/public/:surveyId', getPublicSurvey);

// @desc    Submit an anonymous response
// @route   POST /api/responses/:surveyId
// @access  Public (Respondent)
router.post('/:surveyId', submitResponse);

// @desc    Get analysis data for a survey (for the Dashboard)
// @route   GET /api/responses/analysis/:surveyId
// @access  Private (Creator)
router.get('/analysis/:surveyId', protect, getSurveyAnalysis);

export default router;
