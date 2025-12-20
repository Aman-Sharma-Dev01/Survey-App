import mongoose from 'mongoose';

const contactSchema = mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true },
        subject: { type: String, default: 'General Inquiry' },
        message: { type: String, required: true },
        status: { 
            type: String, 
            enum: ['new', 'read', 'replied', 'archived'], 
            default: 'new' 
        },
        notes: { type: String }, // Admin notes
        repliedAt: { type: Date },
        repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    { timestamps: true }
);

export default mongoose.model('Contact', contactSchema);
