import { fetchApi } from './api';

// Generate AI insights for a survey's analytics data
export const generateSurveyInsights = async ({ surveyId, surveyTitle, analysisSummary }) => {
    const payload = {
        surveyId,
        surveyTitle,
        analysis: analysisSummary,
    };

    const res = await fetchApi('/ai/insights', 'POST', payload, true);
    return res?.insights || '';
};
