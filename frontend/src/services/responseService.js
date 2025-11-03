import { fetchApi } from './api';

// API Call: GET /responses/public/:surveyId (Phase III, Step 6)
export const getPublicSurvey = async (surveyId) => {
    return fetchApi(`/responses/public/${surveyId}`, 'GET', null, false); // Not protected
};

// API Call: POST /responses/:surveyId (Phase III, Step 7)
export const submitAnonymousResponse = async (surveyId, answers) => {
    return fetchApi(`/responses/${surveyId}`, 'POST', { answers }, false); // Not protected
};

// API Call: GET /responses/analysis/:surveyId (Phase IV, Step 8)
export const getSurveyAnalysis = async (surveyId) => {
    return fetchApi(`/responses/analysis/${surveyId}`, 'GET', null, true); // Protected
};
