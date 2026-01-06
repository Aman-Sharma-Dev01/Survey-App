import { fetchApi } from './api';

// Creator CRUD
export const createCodingTest = (data) => fetchApi('/coding-tests', 'POST', data, true);
export const getCreatorCodingTests = () => fetchApi('/coding-tests', 'GET', null, true);
export const getCodingTestById = (id) => fetchApi(`/coding-tests/${id}`, 'GET', null, true);
export const updateCodingTest = (id, updates) => fetchApi(`/coding-tests/${id}`, 'PUT', updates, true);
export const deleteCodingTest = (id) => fetchApi(`/coding-tests/${id}`, 'DELETE', null, true);
export const updateCodingTestPublishStatus = (id, isPublished) => fetchApi(`/coding-tests/${id}/publish`, 'PUT', { isPublished }, true);

// Public
export const getPublicCodingTest = (id) => fetchApi(`/coding-tests/public/${id}`, 'GET', null, false);
export const checkCodingRollNoExists = (id, rollNo) => fetchApi(`/coding-tests/check-rollno/${id}`, 'POST', { rollNo }, false);
export const submitCodingTestResponse = (id, payload) => fetchApi(`/coding-tests/submit/${id}`, 'POST', payload, false);

// Analytics
export const getCodingTestAnalytics = (id) => fetchApi(`/coding-tests/analytics/${id}`, 'GET', null, true);

export const getCodingTestShareUrl = (id) => `${window.location.origin}/#coding/${id}`;
export const getCodingTestQRCodeUrl = (id) => {
  const url = getCodingTestShareUrl(id);
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
};
