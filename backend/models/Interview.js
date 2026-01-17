import mongoose from 'mongoose';

// Schema for chat messages during interview
const chatMessageSchema = mongoose.Schema({
    senderEmail: { type: String, required: true },
    senderName: { type: String, required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

// Schema for participants
const participantSchema = mongoose.Schema({
    email: { type: String, required: true }, // Gmail ID used for access control
    name: { type: String },
    role: { 
        type: String, 
        enum: ['host', 'interviewer', 'candidate', 'observer'], 
        default: 'candidate' 
    },
    invitedAt: { type: Date, default: Date.now },
    joinedAt: { type: Date, default: null },
    leftAt: { type: Date, default: null },
    hasJoined: { type: Boolean, default: false },
    reminderSent: { type: Boolean, default: false }
});

// Main Interview schema
const interviewSchema = mongoose.Schema(
    {
        title: { type: String, required: true },
        description: { type: String },
        
        // Host/Creator (the logged-in user who schedules the interview)
        host: { 
            type: mongoose.Schema.Types.ObjectId, 
            required: true, 
            ref: 'User' 
        },
        hostEmail: { type: String, required: true }, // Gmail ID of host for quick lookup

        // Participants (invited Gmail IDs)
        participants: [participantSchema],

        // Scheduling
        scheduledAt: { type: Date, required: true },
        duration: { type: Number, default: 60 }, // Duration in minutes
        endedAt: { type: Date, default: null },
        
        // Timezone for display purposes
        timeZone: { type: String, default: 'UTC' },

        // Interview status
        status: { 
            type: String, 
            enum: ['scheduled', 'in-progress', 'completed', 'cancelled'], 
            default: 'scheduled' 
        },

        // Room/Meeting ID (unique identifier for the WebRTC room)
        roomId: { type: String, required: true },

        // Chat history
        chatMessages: [chatMessageSchema],

        // Post-interview fields (filled by host after interview)
        outcome: {
            type: String,
            enum: ['pending', 'passed', 'failed', 'on-hold', 'rescheduled'],
            default: 'pending'
        },
        privateNotes: { type: String, default: '' }, // Host's private notes
        
        // Interview settings
        settings: {
            enableVideo: { type: Boolean, default: true },
            enableAudio: { type: Boolean, default: true },
            enableChat: { type: Boolean, default: true },
            enableScreenShare: { type: Boolean, default: true },
            maxParticipants: { type: Number, default: 10 }
        },

        // Reminder settings
        remindersSent: {
            oneDayBefore: { type: Boolean, default: false },
            oneHourBefore: { type: Boolean, default: false },
            fifteenMinBefore: { type: Boolean, default: false }
        }
    },
    { timestamps: true }
);

// Generate unique room ID before save
interviewSchema.pre('validate', function(next) {
    if (!this.roomId) {
        // Generate a unique room ID: prefix + timestamp + random string
        const timestamp = Date.now().toString(36);
        const randomStr = Math.random().toString(36).substring(2, 8);
        this.roomId = `szint_${timestamp}_${randomStr}`;
    }
    next();
});

// Virtual to check if interview is joinable (within 15 mins before or during scheduled time)
interviewSchema.virtual('isJoinable').get(function() {
    if (this.status === 'cancelled' || this.status === 'completed') return false;
    
    const now = new Date();
    const scheduledTime = new Date(this.scheduledAt);
    const endTime = new Date(scheduledTime.getTime() + this.duration * 60000);
    
    // Allow joining 15 minutes before scheduled time
    const joinWindowStart = new Date(scheduledTime.getTime() - 15 * 60000);
    
    return now >= joinWindowStart && now <= endTime;
});

// Virtual to check if interview is upcoming (not started yet but scheduled)
interviewSchema.virtual('isUpcoming').get(function() {
    if (this.status !== 'scheduled') return false;
    
    const now = new Date();
    const scheduledTime = new Date(this.scheduledAt);
    
    return now < scheduledTime;
});

// Method to check if an email is authorized to join
interviewSchema.methods.isAuthorized = function(email) {
    if (!email) return false;
    const lowerEmail = email.toLowerCase();
    
    // Host is always authorized
    if (this.hostEmail.toLowerCase() === lowerEmail) return true;
    
    // Check if email is in participants list
    return this.participants.some(p => p.email.toLowerCase() === lowerEmail);
};

// Method to check if a participant has already joined (for single-join enforcement)
interviewSchema.methods.hasParticipantJoined = function(email) {
    if (!email) return false;
    const lowerEmail = email.toLowerCase();
    
    // Host check
    if (this.hostEmail.toLowerCase() === lowerEmail) {
        // Host can rejoin
        return false;
    }
    
    const participant = this.participants.find(p => p.email.toLowerCase() === lowerEmail);
    return participant ? participant.hasJoined : false;
};

// Ensure virtuals are included in JSON output
interviewSchema.set('toJSON', { virtuals: true });
interviewSchema.set('toObject', { virtuals: true });

// Indexes for efficient queries
interviewSchema.index({ host: 1, scheduledAt: -1 });
interviewSchema.index({ 'participants.email': 1 });
interviewSchema.index({ roomId: 1 }, { unique: true });
interviewSchema.index({ status: 1, scheduledAt: 1 });

const Interview = mongoose.model('Interview', interviewSchema);
export default Interview;
