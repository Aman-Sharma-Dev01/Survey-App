import { fetchApi } from './api';

// API Call: GET /surveys (Phase II, Step 4)
export const getCreatorSurveys = async () => {
    return fetchApi('/surveys', 'GET', null, true);
};

// API Call: POST /surveys (Phase II, Step 3)
export const createSurvey = async (surveyData) => {
    return fetchApi('/surveys', 'POST', surveyData, true);
};

// API Call: PUT /surveys/:surveyId (Phase II, Step 5)
export const updateSurveyPublishStatus = async (surveyId, isPublished) => {
    return fetchApi(`/surveys/${surveyId}`, 'PUT', { isPublished }, true);
};

// Note: Your page components (Dashboard.jsx, SurveyCreate.jsx) should now import and use these functions.
