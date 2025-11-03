import { fetchApi } from './api';

/**
 * Handles the creator registration process.
 * API Call: POST /auth/register (Phase I, Step 1)
 * @param {object} credentials - { name, email, password }
 * @returns {Promise<object>} - { _id, name, email, token }
 */
export const registerCreator = async (credentials) => {
    // The route is publicly accessible, so isProtected is false
    return fetchApi('/auth/register', 'POST', credentials, false); 
};

/**
 * Handles the creator login process.
 * API Call: POST /auth/login (Phase I, Step 2)
 * @param {object} credentials - { email, password }
 * @returns {Promise<object>} - { _id, name, email, token }
 */
export const loginCreator = async (credentials) => {
    // The route is publicly accessible, so isProtected is false
    return fetchApi('/auth/login', 'POST', credentials, false);
};
