import { fetchApi } from './api';

/**
 * Coupon/Offer Service - handles all coupon-related API calls
 */

// Get offer settings (admin only)
export const getOfferSettings = async () => {
    return fetchApi('/coupons/settings', 'GET', null, true);
};

// Toggle new user offer (admin only)
export const toggleNewUserOffer = async () => {
    return fetchApi('/coupons/settings/toggle', 'PUT', null, true);
};

// Create manual voucher for specific email (admin only)
export const createManualVoucher = async (email, premiumDays = 7) => {
    return fetchApi('/coupons/manual', 'POST', { email, premiumDays }, true);
};

// Get all coupons (admin only)
export const getAllCoupons = async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchApi(`/coupons/all${queryString ? `?${queryString}` : ''}`, 'GET', null, true);
};

// Get coupon statistics (admin only)
export const getCouponStats = async () => {
    return fetchApi('/coupons/stats', 'GET', null, true);
};

// Get user's assigned coupon
export const getMyCoupon = async () => {
    return fetchApi('/coupons/my-coupon', 'GET', null, true);
};

// Apply/redeem a coupon code
export const applyCoupon = async (code) => {
    return fetchApi('/coupons/apply', 'POST', { code }, true);
};

// Delete a coupon (admin only)
export const deleteCoupon = async (couponId) => {
    return fetchApi(`/coupons/${couponId}`, 'DELETE', null, true);
};
