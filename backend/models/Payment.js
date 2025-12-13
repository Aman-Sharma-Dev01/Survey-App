import mongoose from 'mongoose';

const paymentSchema = mongoose.Schema(
    {
        user: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User', 
            required: true 
        },
        plan: {
            type: String,
            enum: ['pro', 'power'],
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        credits: {
            type: Number,
            required: true
        },
        transactionId: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'verified', 'rejected'],
            default: 'pending'
        },
        verifiedAt: Date,
        verifiedBy: String // Admin who verified
    },
    { timestamps: true }
);

// Prevent duplicate transaction IDs
paymentSchema.index({ transactionId: 1 }, { unique: true });

export default mongoose.model('Payment', paymentSchema);
