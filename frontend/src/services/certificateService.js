import { fetchApi } from './api';

/**
 * Certificate Service - Handles all certificate-related API calls
 */

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

/**
 * Verify a certificate by its unique ID (Public - for QR code scanning)
 * @param {string} certificateId - The unique certificate ID
 * @returns {Promise<object>} Verification result with certificate details
 */
export const verifyCertificate = async (certificateId) => {
    return await fetchApi(`/certificates/verify/${certificateId}`, 'GET', null, false);
};

// ============================================
// PROTECTED ROUTES (Admin only)
// ============================================

/**
 * Get all certificates (Admin only)
 * @param {object} params - Query parameters { page, limit, search }
 * @returns {Promise<object>} Paginated list of certificates
 */
export const getAllCertificates = async (params = {}) => {
    const { page = 1, limit = 20, search = '' } = params;
    const queryString = new URLSearchParams({ page, limit, search }).toString();
    return await fetchApi(`/certificates?${queryString}`, 'GET', null, true);
};

/**
 * Get a single certificate by MongoDB ID (Admin only)
 * @param {string} id - MongoDB ObjectId
 * @returns {Promise<object>} Certificate details
 */
export const getCertificateById = async (id) => {
    return await fetchApi(`/certificates/${id}`, 'GET', null, true);
};

/**
 * Create a new certificate (Admin only)
 * @param {object} certificateData - Certificate data
 * @returns {Promise<object>} Created certificate with verification URL
 */
export const createCertificate = async (certificateData) => {
    return await fetchApi('/certificates', 'POST', certificateData, true);
};

/**
 * Update a certificate (Admin only)
 * @param {string} id - MongoDB ObjectId
 * @param {object} updates - Fields to update
 * @returns {Promise<object>} Updated certificate
 */
export const updateCertificate = async (id, updates) => {
    return await fetchApi(`/certificates/${id}`, 'PUT', updates, true);
};

/**
 * Delete a certificate (Admin only)
 * @param {string} id - MongoDB ObjectId
 * @returns {Promise<object>} Deletion confirmation
 */
export const deleteCertificate = async (id) => {
    return await fetchApi(`/certificates/${id}`, 'DELETE', null, true);
};

/**
 * Revoke/Invalidate a certificate (Admin only)
 * @param {string} id - MongoDB ObjectId
 * @returns {Promise<object>} Revoked certificate
 */
export const revokeCertificate = async (id) => {
    return await fetchApi(`/certificates/${id}/revoke`, 'PATCH', null, true);
};

/**
 * Reinstate a revoked certificate (Admin only)
 * @param {string} id - MongoDB ObjectId
 * @returns {Promise<object>} Reinstated certificate
 */
export const reinstateCertificate = async (id) => {
    return await fetchApi(`/certificates/${id}/reinstate`, 'PATCH', null, true);
};

/**
 * Get certificate statistics (Admin only)
 * @returns {Promise<object>} Certificate stats overview
 */
export const getCertificateStats = async () => {
    return await fetchApi('/certificates/stats/overview', 'GET', null, true);
};

/**
 * Generate QR code URL for a certificate
 * @param {string} certificateId - The unique certificate ID
 * @returns {string} QR code image URL (using external QR API)
 */
export const getQRCodeUrl = (certificateId) => {
    const verificationUrl = `https://surveyzen.live/#/verify-certificate/${certificateId}`;
    // Using QR Server API (free, no API key required)
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(verificationUrl)}`;
};

/**
 * Get verification URL for a certificate
 * @param {string} certificateId - The unique certificate ID
 * @returns {string} Full verification URL
 */
export const getVerificationUrl = (certificateId) => {
    return `https://surveyzen.live/#/verify-certificate/${certificateId}`;
};
