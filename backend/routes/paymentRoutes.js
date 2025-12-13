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
        paymentLink: 'https://urpy.link/Yv2F3F'
    },
    power: {
        amount: 50,
        credits: 10000,
        name: 'Power',
        paymentLink: '' // Add your power plan link here
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
        
        // Add credits to user
        const user = await User.findById(payment.user);
        user.credits += payment.credits;
        await user.save();
        
        res.json({
            message: `Payment approved! ${payment.credits} credits added to user.`,
            payment,
            userCredits: user.credits
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
        
        // Add credits to user
        const user = await User.findById(payment.user);
        user.credits += payment.credits;
        await user.save();
        
        res.json({
            message: `Payment approved! ${payment.credits} credits added.`,
            payment,
            userEmail: user.email,
            userCredits: user.credits
        });
    } catch (error) {
        res.status(500).json({ message: 'Error approving payment' });
    }
});

export default router;
