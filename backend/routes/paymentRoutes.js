import express from 'express';
import Payment from '../models/Payment.js';
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

// Payment plans configuration
const PLANS = {
    pro: {
        amount: 10,
        credits: 1000,
        name: 'Pro',
        paymentLink: 'https://urpy.link/Yv2F3F@',
        durationMonths: 3 // 3 months subscription
    },
    power: {
        amount: 50,
        credits: 10000,
        name: 'Power',
        paymentLink: 'https://urpy.link/Lt0Yh4@',
        durationMonths: 24 // 2 years subscription
    }
};

// @desc    Get payment plans
// @route   GET /api/payments/plans
// @access  Public
router.get('/plans', (req, res) => {
    const plans = Object.entries(PLANS).map(([key, value]) => ({
        id: key,
        ...value
    }));
    res.json(plans);
});

// @desc    Get payment link for a plan
// @route   GET /api/payments/link/:plan
// @access  Private
router.get('/link/:plan', protect, (req, res) => {
    const { plan } = req.params;
    
    if (!PLANS[plan]) {
        return res.status(400).json({ message: 'Invalid plan' });
    }
    
    const planDetails = PLANS[plan];
    
    if (!planDetails.paymentLink) {
        return res.status(400).json({ message: 'Payment link not available for this plan' });
    }
    
    res.json({
        paymentLink: planDetails.paymentLink,
        amount: planDetails.amount,
        credits: planDetails.credits,
        plan: plan,
        userId: req.user._id,
        // Instructions for user
        instructions: `Please include your email (${req.user.email}) in the payment note/remark for verification.`
    });
});

// @desc    Submit payment for verification
// @route   POST /api/payments/verify
// @access  Private
router.post('/verify', protect, async (req, res) => {
    try {
        const { transactionId, plan } = req.body;
        
        if (!transactionId || !plan) {
            return res.status(400).json({ message: 'Transaction ID and plan are required' });
        }
        
        if (!PLANS[plan]) {
            return res.status(400).json({ message: 'Invalid plan' });
        }
        
        // Check if transaction ID already used
        const existingPayment = await Payment.findOne({ transactionId });
        if (existingPayment) {
            return res.status(400).json({ message: 'This transaction ID has already been used' });
        }
        
        const planDetails = PLANS[plan];
        
        // Create payment record
        const payment = new Payment({
            user: req.user._id,
            plan,
            amount: planDetails.amount,
            credits: planDetails.credits,
            transactionId,
            status: 'pending'
        });
        
        await payment.save();
        
        res.json({
            message: 'Payment submitted for verification. Credits will be added once verified.',
            paymentId: payment._id,
            status: 'pending'
        });
    } catch (error) {
        console.error('Payment verification error:', error);
        if (error.code === 11000) {
            return res.status(400).json({ message: 'This transaction ID has already been used' });
        }
        res.status(500).json({ message: 'Error submitting payment' });
    }
});

// @desc    Get user's payment history
// @route   GET /api/payments/history
// @access  Private
router.get('/history', protect, async (req, res) => {
    try {
        const payments = await Payment.find({ user: req.user._id })
            .sort({ createdAt: -1 });
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching payment history' });
    }
});

// @desc    Get all payments history (Admin)
// @route   GET /api/payments/all
// @access  Private (Admin only)
router.get('/all', protect, isAdmin, async (req, res) => {
    try {
        const payments = await Payment.find({})
            .populate('user', 'name email')
            .sort({ createdAt: -1 });
        
        // Calculate stats
        const stats = {
            total: payments.length,
            pending: payments.filter(p => p.status === 'pending').length,
            verified: payments.filter(p => p.status === 'verified').length,
            rejected: payments.filter(p => p.status === 'rejected').length,
            totalRevenue: payments.filter(p => p.status === 'verified').reduce((sum, p) => sum + p.amount, 0),
            totalCreditsGiven: payments.filter(p => p.status === 'verified').reduce((sum, p) => sum + p.credits, 0)
        };
        
        res.json({ payments, stats });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching all payments' });
    }
});

// @desc    Get pending payments (Admin)
// @route   GET /api/payments/pending
// @access  Private (Admin only)
router.get('/pending', protect, isAdmin, async (req, res) => {
    try {
        const payments = await Payment.find({ status: 'pending' })
            .populate('user', 'name email')
            .sort({ createdAt: -1 });
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching pending payments' });
    }
});

// @desc    Approve payment and add credits (Admin)
// @route   POST /api/payments/approve/:paymentId
// @access  Private (Admin only)
router.post('/approve/:paymentId', protect, isAdmin, async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.paymentId);
        
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }
        
        if (payment.status !== 'pending') {
            return res.status(400).json({ message: 'Payment already processed' });
        }
        
        // Update payment status
        payment.status = 'verified';
        payment.verifiedAt = new Date();
        payment.verifiedBy = req.user.email;
        await payment.save();
        
        // Get plan details
        const planDetails = PLANS[payment.plan];
        
        // Add credits and activate plan for user
        const user = await User.findById(payment.user);
        user.credits += payment.credits;
        
        // Set subscription plan
        user.plan = payment.plan;
        user.planActivatedAt = new Date();
        
        // Calculate expiration date
        const expirationDate = new Date();
        expirationDate.setMonth(expirationDate.getMonth() + planDetails.durationMonths);
        user.planExpiresAt = expirationDate;
        
        await user.save();
        
        res.json({
            message: `Payment approved! ${payment.credits} credits added. ${planDetails.name} plan activated until ${expirationDate.toLocaleDateString()}.`,
            payment,
            userCredits: user.credits,
            plan: user.plan,
            planExpiresAt: user.planExpiresAt
        });
    } catch (error) {
        console.error('Approve payment error:', error);
        res.status(500).json({ message: 'Error approving payment' });
    }
});

// @desc    Reject payment (Admin)
// @route   POST /api/payments/reject/:paymentId
// @access  Private (Admin only)
router.post('/reject/:paymentId', protect, isAdmin, async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.paymentId);
        
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }
        
        if (payment.status !== 'pending') {
            return res.status(400).json({ message: 'Payment already processed' });
        }
        
        payment.status = 'rejected';
        payment.verifiedAt = new Date();
        payment.verifiedBy = req.user.email;
        await payment.save();
        
        res.json({
            message: 'Payment rejected',
            payment
        });
    } catch (error) {
        res.status(500).json({ message: 'Error rejecting payment' });
    }
});

// @desc    Quick verify by transaction ID (Admin convenience)
// @route   POST /api/payments/quick-approve
// @access  Private (Admin only)
router.post('/quick-approve', protect, isAdmin, async (req, res) => {
    try {
        const { transactionId } = req.body;
        
        const payment = await Payment.findOne({ transactionId, status: 'pending' });
        
        if (!payment) {
            return res.status(404).json({ message: 'Pending payment with this transaction ID not found' });
        }
        
        // Update payment status
        payment.status = 'verified';
        payment.verifiedAt = new Date();
        payment.verifiedBy = req.user.email;
        await payment.save();
        
        // Get plan details
        const planDetails = PLANS[payment.plan];
        
        // Add credits and activate plan for user
        const user = await User.findById(payment.user);
        user.credits += payment.credits;
        
        // Set subscription plan
        user.plan = payment.plan;
        user.planActivatedAt = new Date();
        
        // Calculate expiration date
        const expirationDate = new Date();
        expirationDate.setMonth(expirationDate.getMonth() + planDetails.durationMonths);
        user.planExpiresAt = expirationDate;
        
        await user.save();
        
        res.json({
            message: `Payment approved! ${payment.credits} credits added. ${planDetails.name} plan activated until ${expirationDate.toLocaleDateString()}.`,
            payment,
            userEmail: user.email,
            userCredits: user.credits,
            plan: user.plan,
            planExpiresAt: user.planExpiresAt
        });
    } catch (error) {
        res.status(500).json({ message: 'Error approving payment' });
    }
});

// @desc    Get all users with premium plans (Admin)
// @route   GET /api/payments/premium-users
// @access  Private (Admin only)
router.get('/premium-users', protect, isAdmin, async (req, res) => {
    try {
        const users = await User.find({
            plan: { $in: ['pro', 'power'] }
        }).select('name email plan planActivatedAt planExpiresAt credits').sort({ planActivatedAt: -1 });
        
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching premium users' });
    }
});

// @desc    Grant power plan to a user by email (Admin)
// @route   POST /api/payments/grant-plan
// @access  Private (Admin only)
router.post('/grant-plan', protect, isAdmin, async (req, res) => {
    try {
        const { email, plan = 'power', durationMonths } = req.body;
        
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }
        
        if (!['pro', 'power'].includes(plan)) {
            return res.status(400).json({ message: 'Invalid plan. Must be pro or power.' });
        }
        
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found with this email' });
        }
        
        // Get plan details
        const planDetails = PLANS[plan];
        const months = durationMonths || planDetails.durationMonths;
        
        // Set subscription plan
        user.plan = plan;
        user.planActivatedAt = new Date();
        
        // Calculate expiration date
        const expirationDate = new Date();
        expirationDate.setMonth(expirationDate.getMonth() + months);
        user.planExpiresAt = expirationDate;
        
        await user.save();
        
        res.json({
            message: `${planDetails.name} plan granted to ${email} until ${expirationDate.toLocaleDateString()}`,
            user: {
                email: user.email,
                name: user.name,
                plan: user.plan,
                planActivatedAt: user.planActivatedAt,
                planExpiresAt: user.planExpiresAt
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error granting plan' });
    }
});

// @desc    Revoke plan from a user by email (Admin)
// @route   POST /api/payments/revoke-plan
// @access  Private (Admin only)
router.post('/revoke-plan', protect, isAdmin, async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }
        
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found with this email' });
        }
        
        const previousPlan = user.plan;
        
        // Reset to free plan
        user.plan = 'free';
        user.planActivatedAt = null;
        user.planExpiresAt = null;
        
        await user.save();
        
        res.json({
            message: `Plan revoked from ${email}. Changed from ${previousPlan} to free.`,
            user: {
                email: user.email,
                name: user.name,
                plan: user.plan
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error revoking plan' });
    }
});

export default router;
