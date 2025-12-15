import express from 'express';
import crypto from 'crypto';
import Coupon from '../models/Coupon.js';
import OfferSettings from '../models/OfferSettings.js';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin email(s) allowed to access admin routes
const ADMIN_EMAILS = ['support@surveyzen.live'];

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
    if (!ADMIN_EMAILS.includes(req.user.email)) {
        return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    next();
};

// Generate a unique coupon code
const generateCouponCode = () => {
    const prefix = 'SZ';
    const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `${prefix}-${randomPart}`;
};

// @desc    Get offer settings (admin)
// @route   GET /api/coupons/settings
// @access  Admin
router.get('/settings', protect, isAdmin, async (req, res) => {
    try {
        let settings = await OfferSettings.findOne({ key: 'global' });
        
        if (!settings) {
            // Create default settings if not exists
            settings = new OfferSettings({ key: 'global' });
            await settings.save();
        }
        
        res.json(settings);
    } catch (error) {
        console.error('Error fetching offer settings:', error);
        res.status(500).json({ message: 'Error fetching offer settings' });
    }
});

// @desc    Toggle new user offer
// @route   PUT /api/coupons/settings/toggle
// @access  Admin
router.put('/settings/toggle', protect, isAdmin, async (req, res) => {
    try {
        let settings = await OfferSettings.findOne({ key: 'global' });
        
        if (!settings) {
            settings = new OfferSettings({ key: 'global' });
        }
        
        settings.isNewUserOfferActive = !settings.isNewUserOfferActive;
        settings.lastUpdatedBy = req.user._id;
        await settings.save();
        
        res.json({ 
            success: true, 
            isNewUserOfferActive: settings.isNewUserOfferActive,
            message: settings.isNewUserOfferActive 
                ? 'New user offer activated! New registrations will receive coupon codes.' 
                : 'New user offer deactivated.'
        });
    } catch (error) {
        console.error('Error toggling offer:', error);
        res.status(500).json({ message: 'Error toggling offer' });
    }
});

// @desc    Create and assign manual voucher to specific email
// @route   POST /api/coupons/manual
// @access  Admin
router.post('/manual', protect, isAdmin, async (req, res) => {
    try {
        const { email, premiumDays = 7 } = req.body;
        
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }
        
        const normalizedEmail = email.toLowerCase().trim();
        
        // Check if user exists
        const user = await User.findOne({ email: normalizedEmail });
        
        // Generate unique coupon code
        let code;
        let isUnique = false;
        while (!isUnique) {
            code = generateCouponCode();
            const existing = await Coupon.findOne({ code });
            if (!existing) isUnique = true;
        }
        
        // Create the coupon
        const coupon = new Coupon({
            code,
            type: 'manual',
            premiumDays,
            assignedEmail: normalizedEmail,
            assignedTo: user ? user._id : null,
            createdBy: req.user._id
        });
        
        await coupon.save();
        
        // If user exists, assign the coupon to their profile
        if (user) {
            user.couponCode = code;
            user.couponUsed = false;
            await user.save();
        }
        
        res.json({ 
            success: true, 
            coupon: {
                code: coupon.code,
                email: normalizedEmail,
                premiumDays: coupon.premiumDays,
                userExists: !!user
            },
            message: user 
                ? `Voucher ${code} assigned to ${normalizedEmail}. User will see it in their profile.`
                : `Voucher ${code} created for ${normalizedEmail}. It will be assigned when user registers.`
        });
    } catch (error) {
        console.error('Error creating manual voucher:', error);
        res.status(500).json({ message: 'Error creating voucher' });
    }
});

// @desc    Get all coupons (admin)
// @route   GET /api/coupons/all
// @access  Admin
router.get('/all', protect, isAdmin, async (req, res) => {
    try {
        const { type, used, page = 1, limit = 20 } = req.query;
        
        const query = {};
        if (type) query.type = type;
        if (used !== undefined) query.isUsed = used === 'true';
        
        const coupons = await Coupon.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('assignedTo', 'name email')
            .populate('usedBy', 'name email')
            .populate('createdBy', 'name email');
        
        const total = await Coupon.countDocuments(query);
        
        res.json({
            coupons,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Error fetching coupons:', error);
        res.status(500).json({ message: 'Error fetching coupons' });
    }
});

// @desc    Get user's coupon (if any)
// @route   GET /api/coupons/my-coupon
// @access  Private
router.get('/my-coupon', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // If user already used their coupon, don't return it
        if (user.couponUsed || !user.couponCode) {
            return res.json({ 
                hasCoupon: false, 
                couponCode: null,
                couponUsed: user.couponUsed 
            });
        }
        
        res.json({ 
            hasCoupon: true, 
            couponCode: user.couponCode,
            couponUsed: false
        });
    } catch (error) {
        console.error('Error fetching user coupon:', error);
        res.status(500).json({ message: 'Error fetching coupon' });
    }
});

// @desc    Apply/Redeem a coupon code
// @route   POST /api/coupons/apply
// @access  Private
router.post('/apply', protect, async (req, res) => {
    try {
        const { code } = req.body;
        
        if (!code) {
            return res.status(400).json({ message: 'Coupon code is required' });
        }
        
        const normalizedCode = code.toUpperCase().trim();
        
        // Find the coupon
        const coupon = await Coupon.findOne({ code: normalizedCode });
        
        if (!coupon) {
            return res.status(404).json({ message: 'Invalid coupon code' });
        }
        
        if (coupon.isUsed) {
            return res.status(400).json({ message: 'This coupon has already been used' });
        }
        
        // Check if coupon has expired
        if (coupon.expiresAt && new Date() > coupon.expiresAt) {
            return res.status(400).json({ message: 'This coupon has expired' });
        }
        
        // For manual coupons, check if assigned to this user
        if (coupon.type === 'manual' && coupon.assignedEmail) {
            if (coupon.assignedEmail.toLowerCase() !== req.user.email.toLowerCase()) {
                return res.status(403).json({ message: 'This coupon is not assigned to you' });
            }
        }
        
        // For auto coupons, check if it's the user's assigned coupon
        if (coupon.type === 'auto' && coupon.assignedTo) {
            if (coupon.assignedTo.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'This coupon is not assigned to you' });
            }
        }
        
        const user = await User.findById(req.user._id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Mark coupon as used
        coupon.isUsed = true;
        coupon.usedBy = user._id;
        coupon.usedAt = new Date();
        await coupon.save();
        
        // Grant premium access for the specified days
        const premiumDays = coupon.premiumDays || 7;
        const now = new Date();
        const expiryDate = new Date(now.getTime() + premiumDays * 24 * 60 * 60 * 1000);
        
        // If user already has premium, extend it
        if (user.planExpiresAt && user.planExpiresAt > now) {
            user.planExpiresAt = new Date(user.planExpiresAt.getTime() + premiumDays * 24 * 60 * 60 * 1000);
        } else {
            user.plan = 'pro'; // Grant pro plan
            user.planActivatedAt = now;
            user.planExpiresAt = expiryDate;
        }
        
        // Clear coupon from user profile
        user.couponCode = null;
        user.couponUsed = true;
        
        await user.save();
        
        res.json({ 
            success: true, 
            message: `Congratulations! You've received ${premiumDays} days of premium access!`,
            premiumDays,
            planExpiresAt: user.planExpiresAt,
            plan: user.plan
        });
    } catch (error) {
        console.error('Error applying coupon:', error);
        res.status(500).json({ message: 'Error applying coupon' });
    }
});

// @desc    Delete a coupon (admin)
// @route   DELETE /api/coupons/:id
// @access  Admin
router.delete('/:id', protect, isAdmin, async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        
        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }
        
        // If coupon was assigned to a user, remove it from their profile
        if (coupon.assignedTo) {
            await User.findByIdAndUpdate(coupon.assignedTo, {
                $set: { couponCode: null }
            });
        }
        
        await Coupon.findByIdAndDelete(req.params.id);
        
        res.json({ success: true, message: 'Coupon deleted successfully' });
    } catch (error) {
        console.error('Error deleting coupon:', error);
        res.status(500).json({ message: 'Error deleting coupon' });
    }
});

// @desc    Get statistics for coupons
// @route   GET /api/coupons/stats
// @access  Admin
router.get('/stats', protect, isAdmin, async (req, res) => {
    try {
        const totalCoupons = await Coupon.countDocuments();
        const usedCoupons = await Coupon.countDocuments({ isUsed: true });
        const autoCoupons = await Coupon.countDocuments({ type: 'auto' });
        const manualCoupons = await Coupon.countDocuments({ type: 'manual' });
        
        const settings = await OfferSettings.findOne({ key: 'global' });
        
        res.json({
            totalCoupons,
            usedCoupons,
            unusedCoupons: totalCoupons - usedCoupons,
            autoCoupons,
            manualCoupons,
            isNewUserOfferActive: settings?.isNewUserOfferActive || false
        });
    } catch (error) {
        console.error('Error fetching coupon stats:', error);
        res.status(500).json({ message: 'Error fetching stats' });
    }
});

// Helper function to generate and assign coupon to new user
export const assignCouponToNewUser = async (userId, userEmail) => {
    try {
        // Check if offer is active
        const settings = await OfferSettings.findOne({ key: 'global' });
        if (!settings?.isNewUserOfferActive) {
            return null;
        }
        
        // Check if there's a manual coupon waiting for this email
        const manualCoupon = await Coupon.findOne({ 
            assignedEmail: userEmail.toLowerCase(),
            isUsed: false,
            type: 'manual'
        });
        
        if (manualCoupon) {
            // Assign existing manual coupon
            manualCoupon.assignedTo = userId;
            await manualCoupon.save();
            
            await User.findByIdAndUpdate(userId, {
                couponCode: manualCoupon.code,
                couponUsed: false
            });
            
            return manualCoupon.code;
        }
        
        // Generate new auto coupon
        let code;
        let isUnique = false;
        while (!isUnique) {
            code = generateCouponCode();
            const existing = await Coupon.findOne({ code });
            if (!existing) isUnique = true;
        }
        
        const coupon = new Coupon({
            code,
            type: 'auto',
            premiumDays: 7,
            assignedTo: userId,
            assignedEmail: userEmail.toLowerCase()
        });
        
        await coupon.save();
        
        // Update user with coupon
        await User.findByIdAndUpdate(userId, {
            couponCode: code,
            couponUsed: false
        });
        
        return code;
    } catch (error) {
        console.error('Error assigning coupon to new user:', error);
        return null;
    }
};

export default router;
