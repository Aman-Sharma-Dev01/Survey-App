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
