import { fetchApi, BASE_URL } from './api';

/* ===========================================================
   INTERVIEW CRUD OPERATIONS
=========================================================== */

/**
 * Create a new interview
 * @param {Object} interviewData - Interview details including title, scheduledAt, participants, etc.
 * @returns {Promise<Object>} Created interview
 */
export const createInterview = async (interviewData) => {
    return fetchApi('/interviews', 'POST', interviewData, true);
};

/**
 * Get all interviews for the current user (as host or participant)
 * @returns {Promise<Array>} List of interviews
 */
export const getInterviews = async () => {
    return fetchApi('/interviews', 'GET', null, true);
};

/**
 * Get upcoming interviews (for dashboard widget)
 * @returns {Promise<Array>} List of upcoming interviews
 */
export const getUpcomingInterviews = async () => {
    return fetchApi('/interviews/upcoming', 'GET', null, true);
};

/**
 * Get a single interview by ID
 * @param {string} interviewId - Interview ID
 * @returns {Promise<Object>} Interview details
 */
export const getInterviewById = async (interviewId) => {
    return fetchApi(`/interviews/${interviewId}`, 'GET', null, true);
};

/**
 * Get interview by room ID (for joining)
 * @param {string} roomId - Room ID
 * @returns {Promise<Object>} Interview details
 */
export const getInterviewByRoomId = async (roomId) => {
    return fetchApi(`/interviews/room/${roomId}`, 'GET', null, true);
};

/**
 * Update an interview
 * @param {string} interviewId - Interview ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated interview
 */
export const updateInterview = async (interviewId, updates) => {
    return fetchApi(`/interviews/${interviewId}`, 'PUT', updates, true);
};

/**
 * Delete/Cancel an interview
 * @param {string} interviewId - Interview ID
 * @returns {Promise<Object>} Success response
 */
export const deleteInterview = async (interviewId) => {
    return fetchApi(`/interviews/${interviewId}`, 'DELETE', null, true);
};

/* ===========================================================
   INTERVIEW ACTIONS
=========================================================== */

/**
 * Join an interview
 * @param {string} interviewId - Interview ID
 * @returns {Promise<Object>} Join response with roomId
 */
export const joinInterview = async (interviewId) => {
    return fetchApi(`/interviews/${interviewId}/join`, 'POST', null, true);
};

/**
 * Leave an interview
 * @param {string} interviewId - Interview ID
 * @returns {Promise<Object>} Success response
 */
export const leaveInterview = async (interviewId) => {
    return fetchApi(`/interviews/${interviewId}/leave`, 'POST', null, true);
};

/**
 * End an interview (host only)
 * @param {string} interviewId - Interview ID
 * @returns {Promise<Object>} Updated interview
 */
export const endInterview = async (interviewId) => {
    return fetchApi(`/interviews/${interviewId}/end`, 'POST', null, true);
};

/**
 * Update interview outcome and notes (host only, post-interview)
 * @param {string} interviewId - Interview ID
 * @param {Object} data - { outcome, privateNotes }
 * @returns {Promise<Object>} Updated interview
 */
export const updateInterviewOutcome = async (interviewId, data) => {
    return fetchApi(`/interviews/${interviewId}/outcome`, 'PUT', data, true);
};

/* ===========================================================
   CHAT
=========================================================== */

/**
 * Send a chat message (for persistence)
 * @param {string} interviewId - Interview ID
 * @param {string} message - Chat message
 * @returns {Promise<Object>} Success response
 */
export const sendChatMessage = async (interviewId, message) => {
    return fetchApi(`/interviews/${interviewId}/chat`, 'POST', { message }, true);
};

/**
 * Get chat history
 * @param {string} interviewId - Interview ID
 * @returns {Promise<Array>} Chat messages
 */
export const getChatHistory = async (interviewId) => {
    return fetchApi(`/interviews/${interviewId}/chat`, 'GET', null, true);
};

/* ===========================================================
   UTILITY FUNCTIONS
=========================================================== */

/**
 * Get WebSocket URL for the interview room
 * @returns {string} WebSocket URL
 */
export const getSocketUrl = () => {
    // Extract base URL without /api path
    // Socket.io connects to the root URL, not /api
    const baseWithoutApi = BASE_URL.replace('/api', '');
    
    // For local development, use http; for production, ensure https
    if (baseWithoutApi.includes('localhost') || baseWithoutApi.includes('127.0.0.1')) {
        return baseWithoutApi;
    }
    
    // For production, ensure we use https
    return baseWithoutApi.replace('http:', 'https:');
};

/**
 * Format interview date/time for display
 * @param {string|Date} date - Date to format
 * @param {string} timeZone - Timezone
 * @returns {Object} Formatted date and time strings
 */
export const formatInterviewDateTime = (date, timeZone = 'UTC') => {
    const d = new Date(date);
    
    const dateStr = d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone
    });
    
    const timeStr = d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone
    });
    
    return { dateStr, timeStr };
};

/**
 * Check if an interview is joinable (within 15 mins before or during scheduled time)
 * @param {Object} interview - Interview object
 * @returns {boolean}
 */
export const isInterviewJoinable = (interview) => {
    if (interview.status === 'cancelled' || interview.status === 'completed') return false;
    
    const now = new Date();
    const scheduledTime = new Date(interview.scheduledAt);
    const endTime = new Date(scheduledTime.getTime() + interview.duration * 60000);
    
    // Allow joining 15 minutes before scheduled time
    const joinWindowStart = new Date(scheduledTime.getTime() - 15 * 60000);
    
    return now >= joinWindowStart && now <= endTime;
};

/**
 * Get time until interview starts
 * @param {Object} interview - Interview object
 * @returns {Object} { canJoin, timeUntilStart, isOver }
 */
export const getInterviewTimeStatus = (interview) => {
    const now = new Date();
    const scheduledTime = new Date(interview.scheduledAt);
    const endTime = new Date(scheduledTime.getTime() + interview.duration * 60000);
    const joinWindowStart = new Date(scheduledTime.getTime() - 15 * 60000);
    
    const diff = scheduledTime - now;
    const diffMins = Math.floor(diff / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    let timeUntilStart = '';
    if (diffDays > 0) {
        timeUntilStart = `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
        timeUntilStart = `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    } else if (diffMins > 0) {
        timeUntilStart = `${diffMins} minute${diffMins > 1 ? 's' : ''}`;
    } else {
        timeUntilStart = 'Now';
    }
    
    return {
        canJoin: now >= joinWindowStart && now <= endTime && interview.status !== 'completed' && interview.status !== 'cancelled',
        canJoinIn: diffMins > 15 ? `in ${timeUntilStart}` : null,
        timeUntilStart,
        isOver: now > endTime || interview.status === 'completed',
        isUpcoming: now < scheduledTime && interview.status === 'scheduled',
        inProgress: interview.status === 'in-progress' || (now >= scheduledTime && now <= endTime)
    };
};

/**
 * Get status badge color classes
 * @param {string} status - Interview status
 * @returns {string} Tailwind CSS classes
 */
export const getStatusBadgeClasses = (status) => {
    switch (status) {
        case 'scheduled':
            return 'bg-blue-100 text-blue-800';
        case 'in-progress':
            return 'bg-green-100 text-green-800';
        case 'completed':
            return 'bg-gray-100 text-gray-800';
        case 'cancelled':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

/**
 * Get outcome badge color classes
 * @param {string} outcome - Interview outcome
 * @returns {string} Tailwind CSS classes
 */
export const getOutcomeBadgeClasses = (outcome) => {
    switch (outcome) {
        case 'passed':
            return 'bg-green-100 text-green-800';
        case 'failed':
            return 'bg-red-100 text-red-800';
        case 'on-hold':
            return 'bg-yellow-100 text-yellow-800';
        case 'rescheduled':
            return 'bg-blue-100 text-blue-800';
        case 'pending':
        default:
            return 'bg-gray-100 text-gray-800';
    }
};
