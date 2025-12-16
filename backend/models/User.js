import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Helper function to check if email belongs to premium domain (lifetime free premium)
const isPremiumDomain = (email) => {
    if (!email) return false;
    return email.toLowerCase().endsWith('@mru.edu.in');
};

const userSchema = mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: function() { return !this.googleId; } }, // Not required for Google auth
        isVerified: { type: Boolean, default: false },
        credits: { type: Number, default: 200 }, // AI credits for survey generation
        
        // Subscription/Plan fields
        plan: { 
            type: String, 
            enum: ['free', 'pro', 'power'], 
            default: 'free' 
        },
        planExpiresAt: { type: Date, default: null }, // When the plan expires
        planActivatedAt: { type: Date, default: null }, // When the plan was activated
        
        // Google OAuth
        googleId: { type: String, unique: true, sparse: true },
        avatar: { type: String }, // Google profile picture

        // Coupon/Offer fields
        couponCode: { type: String, default: null }, // Assigned coupon code for the user
        couponUsed: { type: Boolean, default: false }, // Whether the user has used their coupon

        verificationToken: String,
        resetPasswordToken: String,
        resetPasswordExpire: Date
    },
    { timestamps: true }
);

// Virtual to check if plan is active
userSchema.virtual('isPlanActive').get(function() {
    // Grant lifetime premium to mru.edu.in emails
    if (isPremiumDomain(this.email)) return true;
    
    if (this.plan === 'free') return false;
    if (!this.planExpiresAt) return false;
    return new Date() < this.planExpiresAt;
});

// Method to check if user has premium features
userSchema.methods.hasPremiumFeatures = function() {
    // Grant lifetime premium to mru.edu.in emails
    if (isPremiumDomain(this.email)) return true;
    
    if (this.plan === 'free') return false;
    if (!this.planExpiresAt) return false;
    return new Date() < this.planExpiresAt;
};

// Ensure virtuals are included in JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

// Hash password
userSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Generate email verification token
userSchema.methods.generateVerificationToken = function () {
    this.verificationToken = crypto.randomBytes(32).toString('hex');
    return this.verificationToken;
};

// Generate password reset token
userSchema.methods.generateResetPasswordToken = function () {
    const token = crypto.randomBytes(32).toString('hex');
    this.resetPasswordToken = token;
    this.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes
    return token;
};

export default mongoose.model('User', userSchema);
