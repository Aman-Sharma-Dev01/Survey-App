import { useState, useCallback } from 'react';
import { fetchApi } from '../services/api';

/**
 * Custom hook to handle API fetching, including loading and error states.
 * This simplifies data fetching in components by providing a clean interface.
 * * @param {boolean} isProtected - Whether the API call requires a JWT token.
 * @returns {object} Contains the call function, loading state, error state, and data state.
 */
const useApi = (isProtected = false) => {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * The function components will call to execute the API request.
     * @param {string} url - The endpoint path (e.g., '/surveys').
     * @param {string} method - The HTTP method (GET, POST, PUT, DELETE).
     * @param {object} requestData - The request body data (optional).
     */
    const callApi = useCallback(async (url, method = 'GET', requestData = null) => {
        setIsLoading(true);
        setError(null);
        setData(null);

        try {
            const responseData = await fetchApi(url, method, requestData, isProtected);
            setData(responseData);
            return responseData; // Return data for immediate component use (e.g., login token)
        } catch (err) {
            // Extract the user-friendly error message
            const errorMessage = err.message || "An unexpected error occurred.";
            setError(errorMessage);
            // Re-throw the error so calling components can handle it (e.g., displaying specific forms errors)
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [isProtected]); // Dependency on isProtected ensures the correct fetch context is used

    return { data, isLoading, error, callApi, setData, setError };
};

export default useApi;
