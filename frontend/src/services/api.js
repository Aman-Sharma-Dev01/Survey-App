// Replace with your backend server URL
// const BASE_URL = 'https://survey-app-e5xz.onrender.com/api'; 
const BASE_URL = 'http://localhost:5000/api'; 
// Helper to access token storage directly (AuthContext stores token in localStorage)
const getAuthToken = () => localStorage.getItem('token');
const removeAuthToken = () => localStorage.removeItem('token');

/**
 * Generic utility function to make API requests.
 * @param {string} url - The endpoint URL segment (e.g., '/auth/login').
 * @param {string} method - HTTP method (e.g., 'GET', 'POST', 'PUT').
 * @param {object|null} data - Request body data.
 * @param {boolean} isProtected - Whether the route requires a JWT token.
 * @returns {Promise<object>} The parsed JSON response data.
 * @throws {Error} If the network request fails or the API returns a non-2xx status.
 */
export const fetchApi = async (url, method = 'GET', data = null, isProtected = false) => {
    const headers = {
        'Content-Type': 'application/json',
    };

    if (isProtected) {
        const token = getAuthToken();
        if (!token) {
            // If the application expects a token but none is found, throw an error
            throw new Error('Authorization required: JWT token is missing.');
        }
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
    };

    try {
        const response = await fetch(`${BASE_URL}${url}`, config);

        if (response.status === 401) {
            // Handle unauthorized access (token expired/invalid) globally
            removeAuthToken(); // Clear token from local storage
            if (isProtected) {
                window.location.hash = '#login'; // Redirect to login page
                throw new Error('Session expired. Please log in again.');
            }
        }

        const responseData = await response.json();

        if (!response.ok) {
            // API returned a non-2xx status (e.g., 400, 404, 500)
            throw new Error(responseData.message || `API error on ${url}: ${response.status}`);
        }

        return responseData;
    } catch (error) {
        // Re-throw to be caught by the calling service or hook (e.g., useApi)
        throw error;
    }
};

// Utility to create small temporary IDs used for client-side keys
export const generateTempId = () => `t_${Math.random().toString(36).slice(2,9)}_${Date.now().toString(36)}`;
