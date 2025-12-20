import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Helper function to check if email belongs to premium domain (lifetime free premium)
const isPremiumDomain = (email) => {
    if (!email) return false;
    return email.toLowerCase().endsWith('@mru.edu.in');
};

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header (Bearer <token>)
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Attach user to the request object (excluding password)
            req.user = await User.findById(decoded.id).select('-password');
            
            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// Middleware to check if user has premium access
const requirePremium = async (req, res, next) => {
    try {
        // User should already be attached by protect middleware
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Check if user has premium access (mru.edu.in email or active paid plan)
        const hasPremium = isPremiumDomain(req.user.email) || req.user.hasPremiumFeatures();
        
        if (!hasPremium) {
            return res.status(403).json({ 
                message: 'This feature requires a Pro subscription',
                requiresPremium: true 
            });
        }

        next();
    } catch (error) {
        console.error('Premium check error:', error);
        res.status(500).json({ message: 'Error checking premium status' });
    }
};

export { protect, requirePremium };
