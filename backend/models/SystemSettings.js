import mongoose from 'mongoose';

const systemSettingsSchema = mongoose.Schema(
    {
        key: { 
            type: String, 
            required: true, 
            unique: true,
            default: 'global' // Only one settings document
        },
        emailVerificationEnabled: { 
            type: Boolean, 
            default: true // Email verification is enabled by default
        },
        lastUpdatedBy: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User',
            default: null
        }
    },
    { timestamps: true }
);

export default mongoose.model('SystemSettings', systemSettingsSchema);
