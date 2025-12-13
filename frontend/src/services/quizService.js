import { fetchApi } from './api';

/* ===========================================================
   QUIZ CRUD OPERATIONS (Creator)
=========================================================== */

// Create a new quiz
export const createQuiz = async (quizData) => {
    return fetchApi('/quizzes', 'POST', quizData, true);
};

// Get all quizzes for the logged-in creator
export const getCreatorQuizzes = async () => {
    return fetchApi('/quizzes', 'GET', null, true);
};

// Get a single quiz by ID (for editing)
export const getQuizById = async (quizId) => {
    return fetchApi(`/quizzes/${quizId}`, 'GET', null, true);
};

// Update a quiz
export const updateQuiz = async (quizId, updates) => {
    return fetchApi(`/quizzes/${quizId}`, 'PUT', updates, true);
};

// Delete a quiz
export const deleteQuiz = async (quizId) => {
    return fetchApi(`/quizzes/${quizId}`, 'DELETE', null, true);
};

// Update quiz publish status
export const updateQuizPublishStatus = async (quizId, isPublished) => {
    return fetchApi(`/quizzes/${quizId}`, 'PUT', { isPublished }, true);
};

/* ===========================================================
   QUIZ TAKING (Public)
=========================================================== */

// Get public quiz for taking (without correct answers)
export const getPublicQuiz = async (quizId) => {
    return fetchApi(`/quizzes/public/${quizId}`, 'GET', null, false);
};

// Check if roll number already exists for a quiz
export const checkRollNoExists = async (quizId, rollNo) => {
    return fetchApi(`/quizzes/check-rollno/${quizId}`, 'POST', { rollNo }, false);
};

// Submit quiz answers
export const submitQuizResponse = async (quizId, responseData) => {
    return fetchApi(`/quizzes/submit/${quizId}`, 'POST', responseData, false);
};

/* ===========================================================
   QUIZ ANALYTICS (Creator)
=========================================================== */

// Get quiz analytics and responses
export const getQuizAnalytics = async (quizId) => {
    return fetchApi(`/quizzes/analytics/${quizId}`, 'GET', null, true);
};
