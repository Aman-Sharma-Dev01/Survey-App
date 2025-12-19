import { fetchApi, BASE_URL } from './api';

/**
 * Upload an image to Cloudinary via backend
 * @param {File} file - The image file to upload
 * @returns {Promise<{success: boolean, url: string, publicId: string}>}
 */
export const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    const token = localStorage.getItem('token');
    
    const response = await fetch(`${BASE_URL}/upload/image`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload image');
    }

    return response.json();
};

/**
 * Delete an image from Cloudinary via backend
 * @param {string} publicId - The Cloudinary public ID of the image
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const deleteImage = async (publicId) => {
    return fetchApi(`/upload/image/${encodeURIComponent(publicId)}`, {
        method: 'DELETE'
    });
};

/**
 * Upload a document (PDF, Word, Text) and extract text content
 * @param {File} file - The document file to upload
 * @returns {Promise<{success: boolean, fileName: string, content: string, isTruncated: boolean}>}
 */
export const parseDocument = async (file) => {
    const formData = new FormData();
    formData.append('document', file);

    const token = localStorage.getItem('token');
    
    const response = await fetch(`${BASE_URL}/upload/document`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to parse document');
    }

    return response.json();
};
