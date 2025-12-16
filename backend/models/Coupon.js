import mongoose from 'mongoose';

const couponSchema = mongoose.Schema(
    {
        code: { 
            type: String, 
            required: true, 
            unique: true,
            uppercase: true,
            trim: true
        },
        type: { 
            type: String, 
            enum: ['auto', 'manual'], // 'auto' for new user registration, 'manual' for admin-assigned
            default: 'auto' 
        },
        isUsed: { 
            type: Boolean, 
            default: false 
        },
        usedBy: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User',
            default: null
        },
        usedAt: { 
            type: Date, 
            default: null 
        },
        assignedTo: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User',
            default: null
        },
        assignedEmail: {
            type: String, // For manual coupons assigned to specific emails
            default: null
        },
        premiumDays: {
            type: Number,
            default: 7 // 7 days of premium access
        },
        expiresAt: {
            type: Date, // Optional expiry date for the coupon itself
            default: null
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        }
    },
    { timestamps: true }
);

// Indexes for faster lookups
// Note: `code` field already has `unique: true` which creates an index — avoid duplicate index creation
// couponSchema.index({ code: 1 });
couponSchema.index({ assignedTo: 1 });
couponSchema.index({ assignedEmail: 1 });
couponSchema.index({ isUsed: 1 });

export default mongoose.model('Coupon', couponSchema);
