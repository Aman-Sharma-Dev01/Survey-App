import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        isVerified: { type: Boolean, default: false },
        credits: { type: Number, default: 200 }, // AI credits for survey generation

        verificationToken: String,
        resetPasswordToken: String,
        resetPasswordExpire: Date
    },
    { timestamps: true }
);

// Hash password
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
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
