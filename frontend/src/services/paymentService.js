import { fetchApi } from './api';

// Get all payment plans
export const getPaymentPlans = async () => {
    return fetchApi('/payments/plans', 'GET');
};

// Get payment link for a specific plan
export const getPaymentLink = async (plan) => {
    return fetchApi(`/payments/link/${plan}`, 'GET', null, true);
};

// Submit payment for verification
export const submitPayment = async (transactionId, plan) => {
    return fetchApi('/payments/verify', 'POST', { transactionId, plan }, true);
};

// Get user's payment history
export const getPaymentHistory = async () => {
    return fetchApi('/payments/history', 'GET', null, true);
};

// Admin: Get pending payments
export const getPendingPayments = async () => {
    return fetchApi('/payments/pending', 'GET', null, true);
};

// Admin: Approve payment
export const approvePayment = async (paymentId) => {
    return fetchApi(`/payments/approve/${paymentId}`, 'POST', null, true);
};

// Admin: Reject payment
export const rejectPayment = async (paymentId) => {
    return fetchApi(`/payments/reject/${paymentId}`, 'POST', null, true);
};

// Admin: Quick approve by transaction ID
export const quickApprovePayment = async (transactionId) => {
    return fetchApi('/payments/quick-approve', 'POST', { transactionId }, true);
};
