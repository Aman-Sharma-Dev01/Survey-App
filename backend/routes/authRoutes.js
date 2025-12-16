import express from 'express';
import User from '../models/User.js';
import SystemSettings from '../models/SystemSettings.js';
import jwt from 'jsonwebtoken';
import { protect } from '../middleware/authMiddleware.js';
// import { sendRegistrationEmail } from '../utils/notificationService.js'; // Removed SMS import
// import { sendRegistrationEmail } from '../utils/emailService.js';
import { sendVerificationEmail, sendResetPasswordEmail ,sendRegistrationEmail } from '../utils/emailService.js';
import { assignCouponToNewUser } from './couponRoutes.js';



const router = express.Router();

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register a new user (Creator)
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    // Check if email verification is enabled
    let settings = await SystemSettings.findOne({ key: 'global' });
    if (!settings) {
        settings = new SystemSettings({ key: 'global' });
        await settings.save();
    }

    const user = new User({ name, email, password });

    if (settings.emailVerificationEnabled) {
        // Email verification is ON - send verification email
        const verifyToken = user.generateVerificationToken();
        await user.save();

        // Send verification email
        await sendVerificationEmail(email, name, verifyToken);

        res.json({ message: "Registration successful! Please verify your email." });
    } else {
        // Email verification is OFF - auto-verify user
        user.isVerified = true;
        await user.save();

        // Try to assign coupon to new user
        try {
            await assignCouponToNewUser(user._id);
        } catch (error) {
            console.error('Error assigning coupon during registration:', error);
        }

        res.json({ 
            message: "Registration successful! You can now login.",
            autoVerified: true
        });
    }
});


// @desc    Auth user & get token (Creator)
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    if (!user.isVerified) {
        return res.status(403).json({ message: "Please verify your email before logging in." });
    }

    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            token: generateToken(user._id),
            credits: user.credits,
        });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
});

// @desc    Google OAuth login/register
// @route   POST /api/auth/google
// @access  Public
router.post('/google', async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({ message: 'Google credential is required' });
        }

        // Verify the Google ID token
        const { OAuth2Client } = await import('google-auth-library');
        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
        
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        
        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture } = payload;

        if (!email) {
            return res.status(400).json({ message: 'Email not provided by Google' });
        }

        // Check if user exists by googleId or email
        let user = await User.findOne({ $or: [{ googleId }, { email }] });

        if (user) {
            // If user exists but doesn't have googleId, link the account
            if (!user.googleId) {
                user.googleId = googleId;
                user.avatar = picture;
                user.isVerified = true; // Google accounts are verified
                await user.save();
            }
        } else {
            // Create new user
            user = new User({
                name: name || email.split('@')[0], // Use email prefix if name not provided
                email,
                googleId,
                avatar: picture,
                isVerified: true, // Google accounts are pre-verified
            });
            await user.save();

            // Assign coupon to new user if offer is active
            try {
                await assignCouponToNewUser(user._id, user.email);
            } catch (error) {
                console.error('Error assigning coupon during Google auth:', error);
            }

            // Send welcome email for new users
            try {
                await sendRegistrationEmail(email, name || email.split('@')[0]);
            } catch (emailError) {
                console.error('Failed to send welcome email:', emailError);
            }
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            token: generateToken(user._id),
            credits: user.credits,
        });
    } catch (error) {
        console.error('Google auth error:', error);
        res.status(401).json({ message: 'Google authentication failed' });
    }
});

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Check if plan is still active
        const isPlanActive = user.hasPremiumFeatures();
        
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            credits: user.credits,
            plan: user.plan || 'free',
            planExpiresAt: user.planExpiresAt,
            planActivatedAt: user.planActivatedAt,
            isPlanActive,
            couponCode: user.couponUsed ? null : user.couponCode,
            couponUsed: user.couponUsed,
            createdAt: user.createdAt
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching profile' });
    }
});

// @desc    Use credits (deduct for AI features)
// @route   POST /api/auth/use-credits
// @access  Private
router.post('/use-credits', protect, async (req, res) => {
    try {
        const { amount = 10 } = req.body;
        const user = await User.findById(req.user._id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        if (user.credits < amount) {
            return res.status(403).json({ 
                message: 'Insufficient credits', 
                credits: user.credits,
                required: amount 
            });
        }
        
        user.credits -= amount;
        await user.save();
        
        res.json({ 
            success: true, 
            credits: user.credits,
            deducted: amount 
        });
    } catch (error) {
        res.status(500).json({ message: 'Error using credits' });
    }
});

// @desc    Get current credits
// @route   GET /api/auth/credits
// @access  Private
router.get('/credits', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('credits');
        res.json({ credits: user.credits });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching credits' });
    }
});

export default router;

router.get("/verify/:token", async (req, res) => {
    const { token } = req.params;

    const user = await User.findOne({ verificationToken: token });
    if (!user) {
        return res.status(400).json({ message: "Invalid or expired verification link" });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();
    
    // Assign coupon to new user if offer is active
    try {
        await assignCouponToNewUser(user._id, user.email);
    } catch (error) {
        console.error('Error assigning coupon during verification:', error);
    }
    
    sendRegistrationEmail(user.email, user.name);
    return res.json({ message: "Verification successful" });
});


router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const resetToken = user.generateResetPasswordToken();
    await user.save();

    await sendResetPasswordEmail(email, resetToken);

    res.json({ message: 'Password reset email sent' });
});

router.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: "Invalid or expired token" });

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.json({ message: "Password reset successful" });
});

// @desc    Get system settings
// @route   GET /api/auth/system-settings
// @access  Public (for checking verification status)
router.get('/system-settings', async (req, res) => {
    try {
        let settings = await SystemSettings.findOne({ key: 'global' });
        if (!settings) {
            settings = new SystemSettings({ key: 'global' });
            await settings.save();
        }
        res.json({
            emailVerificationEnabled: settings.emailVerificationEnabled
        });
    } catch (error) {
        console.error('Error fetching system settings:', error);
        res.status(500).json({ message: 'Error fetching system settings' });
    }
});

// @desc    Update system settings (Admin only)
// @route   PUT /api/auth/system-settings
// @access  Private (Admin)
router.put('/system-settings', protect, async (req, res) => {
    try {
        const ADMIN_EMAIL = 'support@surveyzen.live';
        const user = await User.findById(req.user._id);
        
        if (!user || user.email !== ADMIN_EMAIL) {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const { emailVerificationEnabled } = req.body;

        let settings = await SystemSettings.findOne({ key: 'global' });
        if (!settings) {
            settings = new SystemSettings({ key: 'global' });
        }

        if (typeof emailVerificationEnabled === 'boolean') {
            settings.emailVerificationEnabled = emailVerificationEnabled;
        }
        settings.lastUpdatedBy = req.user._id;
        await settings.save();

        res.json({
            message: 'System settings updated successfully',
            emailVerificationEnabled: settings.emailVerificationEnabled
        });
    } catch (error) {
        console.error('Error updating system settings:', error);
        res.status(500).json({ message: 'Error updating system settings' });
    }
});
