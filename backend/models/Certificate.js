import mongoose from 'mongoose';
import crypto from 'crypto';

const certificateSchema = mongoose.Schema(
    {
        // Unique certificate ID for QR verification
        certificateId: {
            type: String,
            required: true,
            unique: true,
            default: () => crypto.randomBytes(8).toString('hex').toUpperCase()
        },
        
        // Certificate holder details
        holderName: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },
        
        // Internship/Position details
        position: {
            type: String,
            required: true,
            trim: true
        },
        department: {
            type: String,
            trim: true,
            default: 'Technology'
        },
        
        // Duration
        startDate: {
            type: Date,
            required: true
        },
        endDate: {
            type: Date,
            required: true
        },
        
        // Certificate metadata
        issuedAt: {
            type: Date,
            default: Date.now
        },
        
        // Status
        isValid: {
            type: Boolean,
            default: true
        },
        
        // Optional: Link to User if they have an account
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: false
        },
        
        // Additional notes or achievements
        description: {
            type: String,
            trim: true
        },
        
        // Issued by (admin who created the certificate)
        issuedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    },
    { timestamps: true }
);

// Generate verification URL
certificateSchema.methods.getVerificationUrl = function() {
    return `https://surveyzen.live/#/verify-certificate/${this.certificateId}`;
};

// Generate QR code data
certificateSchema.methods.getQRData = function() {
    return {
        url: this.getVerificationUrl(),
        certificateId: this.certificateId,
        holderName: this.holderName,
        position: this.position
    };
};

// Index for faster lookups
certificateSchema.index({ email: 1 });
certificateSchema.index({ holderName: 'text' });

const Certificate = mongoose.model('Certificate', certificateSchema);

export default Certificate;
