import Survey from '../models/Survey.js';
import Response from '../models/Response.js';

// @desc    Get a public survey definition (for respondents to view/fill)
// @route   GET /api/responses/public/:surveyId
// @access  Public (Respondent)
export const getPublicSurvey = async (req, res) => {
    const survey = await Survey.findById(req.params.surveyId).select('title description questions isPublished');

    if (survey && survey.isPublished) {
        res.json(survey);
    } else {
        // Hide survey if not published or not found
        res.status(404).json({ message: 'Survey not found or not currently accepting responses.' });
    }
};

// @desc    Submit an anonymous response
// @route   POST /api/responses/:surveyId
// @access  Public (Respondent)
export const submitResponse = async (req, res) => {
    const surveyId = req.params.surveyId;
    const { answers } = req.body;

    const survey = await Survey.findById(surveyId);

    if (!survey || !survey.isPublished) {
        return res.status(400).json({ message: 'Cannot submit response: Survey is not active.' });
    }

    try {
        const response = new Response({
            survey: surveyId,
            answers: answers,
        });

        const submittedResponse = await response.save();

        // Increment the cached count on the Survey model (for dashboard efficiency)
        survey.responseCount += 1;
        await survey.save();

        // Respond with success, emphasizing anonymity
        res.status(201).json({ message: 'Response submitted successfully and anonymously.', id: submittedResponse._id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error submitting response.' });
    }
};

// @desc    Get analysis data for a survey (for the Dashboard)
// @route   GET /api/responses/analysis/:surveyId
// @access  Private (Creator)
export const getSurveyAnalysis = async (req, res) => {
    const surveyId = req.params.surveyId;

    // 1. Verify the user owns the survey
    const survey = await Survey.findById(surveyId).select('creator responseCount questions');
    if (!survey || survey.creator.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to view this analysis.' });
    }

    // 2. Aggregate the anonymous responses
    const responses = await Response.find({ survey: surveyId });

    // 3. Simple aggregation logic (can be expanded heavily)
    const analysis = {
        totalResponses: responses.length,
        questionBreakdown: {}
    };

    // Initialize breakdown structure
    survey.questions.forEach(q => {
        analysis.questionBreakdown[q._id] = {
            questionText: q.questionText,
            questionType: q.questionType,
            options: q.options.map(opt => ({ text: opt.optionText, count: 0 })),
            freeTextResponses: [],
            totalCount: 0
        };
    });

    // Populate counts and text responses
    responses.forEach(response => {
        response.answers.forEach(answer => {
            const breakdown = analysis.questionBreakdown[answer.questionId];

            if (breakdown) {
                if (breakdown.questionType === 'TEXT' || breakdown.questionType === 'SLIDER') {
                    // Collect all free text/slider values
                    breakdown.freeTextResponses.push(answer.answerValue);
                } else if (breakdown.questionType === 'RADIO') {
                    // Count single choice
                    const option = breakdown.options.find(opt => opt.text === answer.answerValue);
                    if (option) option.count += 1;
                    breakdown.totalCount += 1;
                } else if (breakdown.questionType === 'CHECKBOX') {
                    // Count multiple choice (answerValue is an array)
                    if (Array.isArray(answer.answerValue)) {
                        answer.answerValue.forEach(val => {
                            const option = breakdown.options.find(opt => opt.text === val);
                            if (option) option.count += 1;
                        });
                        breakdown.totalCount += 1;
                    }
                }
            }
        });
    });

    res.json(analysis);
};
