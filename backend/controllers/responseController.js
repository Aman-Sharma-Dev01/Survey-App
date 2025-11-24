import Survey from '../models/Survey.js';
import Response from '../models/Response.js';
import { Parser as Json2csvParser } from 'json2csv';

// ---------------------------------------------------
//  PUBLIC: Get Survey for Respondent
// ---------------------------------------------------
export const getPublicSurvey = async (req, res) => {
    const survey = await Survey.findById(req.params.surveyId)
        .select('title description questions isPublished');

    if (survey && survey.isPublished) {
        return res.json(survey);
    } else {
        return res.status(404).json({
            message: 'Survey not found or not currently accepting responses.'
        });
    }
};

// ---------------------------------------------------
//  PUBLIC: Submit Response (Anonymous)
// ---------------------------------------------------
export const submitResponse = async (req, res) => {
    const surveyId = req.params.surveyId;
    const { answers } = req.body;

    const survey = await Survey.findById(surveyId);
    if (!survey || !survey.isPublished) {
        return res.status(400).json({ message: 'Cannot submit response: Survey is not active.' });
    }

    try {
        const response = new Response({ survey: surveyId, answers });
        const submittedResponse = await response.save();

        survey.responseCount += 1;
        await survey.save();

        return res.status(201).json({
            message: 'Response submitted successfully and anonymously.',
            id: submittedResponse._id
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error submitting response.' });
    }
};

// ---------------------------------------------------
//  PRIVATE: Survey Analysis (for Dashboard)
// ---------------------------------------------------
export const getSurveyAnalysis = async (req, res) => {
    const surveyId = req.params.surveyId;

    const survey = await Survey.findById(surveyId)
        .select('creator responseCount questions');

    if (!survey || survey.creator.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to view this analysis.' });
    }

    const responses = await Response.find({ survey: surveyId });

    const analysis = {
        totalResponses: responses.length,
        questionBreakdown: {}
    };

    survey.questions.forEach(q => {
        analysis.questionBreakdown[q._id] = {
            questionText: q.questionText,
            questionType: q.questionType,
            options: q.options.map(opt => ({ text: opt.optionText, count: 0 })),
            freeTextResponses: [],
            totalCount: 0
        };
    });

    responses.forEach(response => {
        response.answers.forEach(answer => {
            const breakdown = analysis.questionBreakdown[answer.questionId];

            if (!breakdown) return;

            if (['TEXT', 'SLIDER'].includes(breakdown.questionType)) {
                breakdown.freeTextResponses.push(answer.answerValue);
            } else if (breakdown.questionType === 'RADIO') {
                const option = breakdown.options.find(o => o.text === answer.answerValue);
                if (option) option.count++;
                breakdown.totalCount++;
            } else if (breakdown.questionType === 'CHECKBOX') {
                if (Array.isArray(answer.answerValue)) {
                    answer.answerValue.forEach(v => {
                        const option = breakdown.options.find(o => o.text === v);
                        if (option) option.count++;
                    });
                    breakdown.totalCount++;
                }
            }
        });
    });

    return res.json(analysis);
};

// ---------------------------------------------------
//  NEW API #1: EXPORT RESPONSES AS CSV
//  GET /api/responses/export/:surveyId
// ---------------------------------------------------
import { Parser } from "json2csv";

export const exportResponsesCSV = async (req, res) => {
  const surveyId = req.params.surveyId;

  const survey = await Survey.findById(surveyId).select("creator questions");
  if (!survey || survey.creator.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Not authorized" });
  }

  const responses = await Response.find({ survey: surveyId });

  // Build CSV rows: One row per response
  const rows = responses.map((r) => {
    const row = {
      responseId: r._id.toString(),
      submittedAt: r.createdAt,
    };

    survey.questions.forEach((q) => {
      const ans = r.answers.find(a => a.questionId.toString() === q._id.toString());

      row[q.questionText] = ans
        ? Array.isArray(ans.answerValue) ? ans.answerValue.join(", ") : ans.answerValue
        : ""; // blank if no response for this question
    });

    return row;
  });

  const parser = new Parser();
  const csv = parser.parse(rows);

  res.header("Content-Type", "text/csv");
  res.attachment(`survey_${surveyId}_responses.csv`);
  return res.send(csv);
};


// ---------------------------------------------------
//  NEW API #2: SHAREABLE PUBLIC RESULTS
//  GET /api/responses/share/:surveyId
// ---------------------------------------------------
export const getSharedSurveyResults = async (req, res) => {
    const surveyId = req.params.surveyId;

    const survey = await Survey.findById(surveyId).select("questions isShareable");
    if (!survey || !survey.isShareable) {
        return res.status(403).json({ message: "This survey is not publicly shared." });
    }

    const responses = await Response.find({ survey: surveyId });

    const summary = {
        totalResponses: responses.length,
        questions: []
    };

    survey.questions.forEach(q => {
        const breakdown = {
            questionId: q._id,
            questionText: q.questionText,
            type: q.questionType,
            options: q.options.map(o => ({ text: o.optionText, count: 0 })),
            freeTextResponses: []
        };

        responses.forEach(r => {
            const ans = r.answers.find(a => a.questionId.toString() === q._id.toString());
            if (!ans) return;

            if (q.questionType === "TEXT") breakdown.freeTextResponses.push(ans.answerValue);
            if (q.questionType === "RADIO") {
                const opt = breakdown.options.find(o => o.text === ans.answerValue);
                if (opt) opt.count++;
            }
            if (q.questionType === "CHECKBOX") {
                ans.answerValue?.forEach(v => {
                    const opt = breakdown.options.find(o => o.text === v);
                    if (opt) opt.count++;
                });
            }
        });

        summary.questions.push(breakdown);
    });

    res.json(summary);
};
