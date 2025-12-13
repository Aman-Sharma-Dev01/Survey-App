import express from 'express';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { protect } from '../middleware/authMiddleware.js';
// import { sendRegistrationEmail } from '../utils/notificationService.js'; // Removed SMS import
// import { sendRegistrationEmail } from '../utils/emailService.js';
import { sendVerificationEmail, sendResetPasswordEmail ,sendRegistrationEmail } from '../utils/emailService.js';



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

    const user = new User({ name, email, password });

    // Create token
    const verifyToken = user.generateVerificationToken();
    await user.save();

    // Send verification email
    await sendVerificationEmail(email, name, verifyToken);

    res.json({ message: "Registration successful! Please verify your email." });
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
            token: generateToken(user._id),
            credits: user.credits,
        });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
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
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            credits: user.credits,
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
