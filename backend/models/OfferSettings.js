import mongoose from 'mongoose';

const offerSettingsSchema = mongoose.Schema(
    {
        key: { 
            type: String, 
            required: true, 
            unique: true,
            default: 'global' // Only one settings document
        },
        isNewUserOfferActive: { 
            type: Boolean, 
            default: false 
        },
        lastUpdatedBy: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User',
            default: null
        }
    },
    { timestamps: true }
);

export default mongoose.model('OfferSettings', offerSettingsSchema);
