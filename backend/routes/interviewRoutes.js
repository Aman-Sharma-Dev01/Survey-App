import express from 'express';
import Interview from '../models/Interview.js';
import User from '../models/User.js';
import { protect, requirePremium } from '../middleware/authMiddleware.js';
import { sendInterviewInvitation, sendInterviewReminder } from '../utils/emailService.js';

const router = express.Router();

/* ===========================================================
   CREATE NEW INTERVIEW (Premium users only)
   POST /api/interviews
=========================================================== */
router.post('/', protect, requirePremium, async (req, res) => {
    try {
        const { title, description, scheduledAt, duration, timeZone, participants, settings } = req.body;

        if (!title || !scheduledAt) {
            return res.status(400).json({ message: 'Title and scheduled time are required' });
        }

        if (!participants || participants.length === 0) {
            return res.status(400).json({ message: 'At least one participant is required' });
        }

        // Validate scheduled time is in the future
        const scheduleDate = new Date(scheduledAt);
        if (scheduleDate <= new Date()) {
            return res.status(400).json({ message: 'Interview must be scheduled for a future time' });
        }

        // Format participants array with proper structure
        const formattedParticipants = participants.map(p => ({
            email: p.email.toLowerCase().trim(),
            name: p.name || p.email.split('@')[0],
            role: p.role || 'candidate'
        }));

        // Create interview
        const interview = new Interview({
            title,
            description,
            host: req.user._id,
            hostEmail: req.user.email.toLowerCase(),
            scheduledAt: scheduleDate,
            duration: duration || 60,
            timeZone: timeZone || 'UTC',
            participants: formattedParticipants,
            settings: settings || {}
        });

        const createdInterview = await interview.save();

        // Send invitation emails to all participants
        for (const participant of formattedParticipants) {
            try {
                await sendInterviewInvitation({
                    toEmail: participant.email,
                    participantName: participant.name,
                    interviewTitle: title,
                    scheduledAt: scheduleDate,
                    duration,
                    hostName: req.user.name,
                    hostEmail: req.user.email,
                    interviewId: createdInterview._id
                });
            } catch (emailError) {
                console.error(`Failed to send invitation to ${participant.email}:`, emailError);
            }
        }

        res.status(201).json(createdInterview);
    } catch (error) {
        console.error('Create interview error:', error);
        res.status(500).json({ message: 'Error creating interview', error: error.message });
    }
});

/* ===========================================================
   GET ALL INTERVIEWS FOR CURRENT USER (as host or participant)
   GET /api/interviews
=========================================================== */
router.get('/', protect, async (req, res) => {
    try {
        const userEmail = req.user.email.toLowerCase();
        
        // Find interviews where user is host or participant
        const interviews = await Interview.find({
            $or: [
                { host: req.user._id },
                { 'participants.email': userEmail }
            ]
        })
        .populate('host', 'name email avatar')
        .sort({ scheduledAt: 1 });

        // Add role info for the current user
        const enrichedInterviews = interviews.map(interview => {
            const interviewObj = interview.toObject();
            interviewObj.userRole = interview.hostEmail.toLowerCase() === userEmail 
                ? 'host' 
                : interview.participants.find(p => p.email.toLowerCase() === userEmail)?.role || 'participant';
            return interviewObj;
        });

        res.json(enrichedInterviews);
    } catch (error) {
        console.error('Get interviews error:', error);
        res.status(500).json({ message: 'Error fetching interviews' });
    }
});

/* ===========================================================
   GET UPCOMING INTERVIEWS (for dashboard widget)
   GET /api/interviews/upcoming
=========================================================== */
router.get('/upcoming', protect, async (req, res) => {
    try {
        const userEmail = req.user.email.toLowerCase();
        const now = new Date();
        
        const interviews = await Interview.find({
            $or: [
                { host: req.user._id },
                { 'participants.email': userEmail }
            ],
            status: { $in: ['scheduled', 'in-progress'] },
            scheduledAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } // Include today's
        })
        .populate('host', 'name email avatar')
        .sort({ scheduledAt: 1 })
        .limit(5);

        res.json(interviews);
    } catch (error) {
        console.error('Get upcoming interviews error:', error);
        res.status(500).json({ message: 'Error fetching upcoming interviews' });
    }
});

/* ===========================================================
   GET SINGLE INTERVIEW BY ID
   GET /api/interviews/:id
=========================================================== */
router.get('/:id', protect, async (req, res) => {
    try {
        const interview = await Interview.findById(req.params.id)
            .populate('host', 'name email avatar');

        if (!interview) {
            return res.status(404).json({ message: 'Interview not found' });
        }

        // Check if user is authorized
        const userEmail = req.user.email.toLowerCase();
        if (!interview.isAuthorized(userEmail)) {
            return res.status(403).json({ message: 'Not authorized to view this interview' });
        }

        res.json(interview);
    } catch (error) {
        console.error('Get interview error:', error);
        res.status(500).json({ message: 'Error fetching interview' });
    }
});

/* ===========================================================
   GET INTERVIEW BY ROOM ID (for joining)
   GET /api/interviews/room/:roomId
=========================================================== */
router.get('/room/:roomId', protect, async (req, res) => {
    try {
        const interview = await Interview.findOne({ roomId: req.params.roomId })
            .populate('host', 'name email avatar');

        if (!interview) {
            return res.status(404).json({ message: 'Interview room not found' });
        }

        // Check if user is authorized
        const userEmail = req.user.email.toLowerCase();
        if (!interview.isAuthorized(userEmail)) {
            return res.status(403).json({ 
                message: 'You are not invited to this interview. Only invited Gmail IDs can join.',
                unauthorized: true 
            });
        }

        res.json(interview);
    } catch (error) {
        console.error('Get interview by room error:', error);
        res.status(500).json({ message: 'Error fetching interview room' });
    }
});

/* ===========================================================
   JOIN INTERVIEW
   POST /api/interviews/:id/join
=========================================================== */
router.post('/:id/join', protect, async (req, res) => {
    try {
        const interview = await Interview.findById(req.params.id);

        if (!interview) {
            return res.status(404).json({ message: 'Interview not found' });
        }

        const userEmail = req.user.email.toLowerCase();

        // Check authorization
        if (!interview.isAuthorized(userEmail)) {
            return res.status(403).json({ 
                message: 'You are not invited to this interview',
                unauthorized: true 
            });
        }

        // Check if interview is joinable (time-wise)
        if (!interview.isJoinable) {
            if (interview.status === 'completed') {
                return res.status(400).json({ message: 'This interview has ended' });
            }
            if (interview.status === 'cancelled') {
                return res.status(400).json({ message: 'This interview was cancelled' });
            }
            
            const scheduledTime = new Date(interview.scheduledAt);
            const now = new Date();
            if (now < new Date(scheduledTime.getTime() - 15 * 60000)) {
                return res.status(400).json({ 
                    message: 'Interview has not started yet. You can join 15 minutes before the scheduled time.',
                    scheduledAt: interview.scheduledAt,
                    tooEarly: true
                });
            }
        }

        // Check if participant already joined (for non-host users)
        const isHost = interview.hostEmail.toLowerCase() === userEmail;
        if (!isHost) {
            const participant = interview.participants.find(p => p.email.toLowerCase() === userEmail);
            if (participant && participant.hasJoined) {
                // Allow rejoining but log it
                participant.joinedAt = new Date();
            } else if (participant) {
                // First time joining
                participant.hasJoined = true;
                participant.joinedAt = new Date();
            }
        }

        // Update interview status to in-progress if host joins
        if (isHost && interview.status === 'scheduled') {
            interview.status = 'in-progress';
        }

        await interview.save();

        res.json({ 
            success: true, 
            roomId: interview.roomId,
            interview: interview
        });
    } catch (error) {
        console.error('Join interview error:', error);
        res.status(500).json({ message: 'Error joining interview' });
    }
});

/* ===========================================================
   LEAVE INTERVIEW
   POST /api/interviews/:id/leave
=========================================================== */
router.post('/:id/leave', protect, async (req, res) => {
    try {
        const interview = await Interview.findById(req.params.id);

        if (!interview) {
            return res.status(404).json({ message: 'Interview not found' });
        }

        const userEmail = req.user.email.toLowerCase();
        
        // Update participant's left time
        const participant = interview.participants.find(p => p.email.toLowerCase() === userEmail);
        if (participant) {
            participant.leftAt = new Date();
        }

        await interview.save();
        res.json({ success: true });
    } catch (error) {
        console.error('Leave interview error:', error);
        res.status(500).json({ message: 'Error leaving interview' });
    }
});

/* ===========================================================
   END INTERVIEW (Host only)
   POST /api/interviews/:id/end
=========================================================== */
router.post('/:id/end', protect, async (req, res) => {
    try {
        const interview = await Interview.findById(req.params.id);

        if (!interview) {
            return res.status(404).json({ message: 'Interview not found' });
        }

        // Only host can end the interview
        if (interview.host.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the host can end the interview' });
        }

        interview.status = 'completed';
        interview.endedAt = new Date();
        await interview.save();

        res.json({ success: true, interview });
    } catch (error) {
        console.error('End interview error:', error);
        res.status(500).json({ message: 'Error ending interview' });
    }
});

/* ===========================================================
   UPDATE INTERVIEW (Host only)
   PUT /api/interviews/:id
=========================================================== */
router.put('/:id', protect, async (req, res) => {
    try {
        const interview = await Interview.findById(req.params.id);

        if (!interview) {
            return res.status(404).json({ message: 'Interview not found' });
        }

        if (interview.host.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this interview' });
        }

        // Can't update completed or cancelled interviews
        if (['completed', 'cancelled'].includes(interview.status)) {
            return res.status(400).json({ message: 'Cannot update a completed or cancelled interview' });
        }

        const { title, description, scheduledAt, duration, timeZone, participants, settings } = req.body;

        if (title) interview.title = title;
        if (description !== undefined) interview.description = description;
        if (scheduledAt) interview.scheduledAt = new Date(scheduledAt);
        if (duration) interview.duration = duration;
        if (timeZone) interview.timeZone = timeZone;
        if (settings) interview.settings = { ...interview.settings, ...settings };
        
        // Handle participant updates
        if (participants) {
            const existingEmails = interview.participants.map(p => p.email.toLowerCase());
            const newParticipants = participants.filter(p => 
                !existingEmails.includes(p.email.toLowerCase())
            );
            
            // Add new participants
            for (const p of newParticipants) {
                interview.participants.push({
                    email: p.email.toLowerCase().trim(),
                    name: p.name || p.email.split('@')[0],
                    role: p.role || 'candidate'
                });

                // Send invitation to new participants
                try {
                    await sendInterviewInvitation({
                        toEmail: p.email,
                        participantName: p.name || p.email.split('@')[0],
                        interviewTitle: interview.title,
                        scheduledAt: interview.scheduledAt,
                        duration: interview.duration,
                        hostName: req.user.name,
                        hostEmail: req.user.email,
                        interviewId: interview._id
                    });
                } catch (emailError) {
                    console.error(`Failed to send invitation to ${p.email}:`, emailError);
                }
            }
        }

        await interview.save();
        res.json(interview);
    } catch (error) {
        console.error('Update interview error:', error);
        res.status(500).json({ message: 'Error updating interview' });
    }
});

/* ===========================================================
   UPDATE INTERVIEW OUTCOME & NOTES (Host only, post-interview)
   PUT /api/interviews/:id/outcome
=========================================================== */
router.put('/:id/outcome', protect, async (req, res) => {
    try {
        const interview = await Interview.findById(req.params.id);

        if (!interview) {
            return res.status(404).json({ message: 'Interview not found' });
        }

        if (interview.host.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the host can update the outcome' });
        }

        const { outcome, privateNotes } = req.body;

        if (outcome) interview.outcome = outcome;
        if (privateNotes !== undefined) interview.privateNotes = privateNotes;

        await interview.save();
        res.json(interview);
    } catch (error) {
        console.error('Update outcome error:', error);
        res.status(500).json({ message: 'Error updating interview outcome' });
    }
});

/* ===========================================================
   DELETE/CANCEL INTERVIEW (Host only)
   DELETE /api/interviews/:id
=========================================================== */
router.delete('/:id', protect, async (req, res) => {
    try {
        const interview = await Interview.findById(req.params.id);

        if (!interview) {
            return res.status(404).json({ message: 'Interview not found' });
        }

        if (interview.host.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this interview' });
        }

        // If interview hasn't started, delete it completely
        // If in progress, mark as cancelled
        if (interview.status === 'in-progress') {
            interview.status = 'cancelled';
            await interview.save();
        } else {
            await Interview.findByIdAndDelete(req.params.id);
        }

        res.json({ success: true, message: 'Interview cancelled/deleted successfully' });
    } catch (error) {
        console.error('Delete interview error:', error);
        res.status(500).json({ message: 'Error deleting interview' });
    }
});

/* ===========================================================
   ADD CHAT MESSAGE (for storing chat history)
   POST /api/interviews/:id/chat
=========================================================== */
router.post('/:id/chat', protect, async (req, res) => {
    try {
        const interview = await Interview.findById(req.params.id);

        if (!interview) {
            return res.status(404).json({ message: 'Interview not found' });
        }

        const userEmail = req.user.email.toLowerCase();
        if (!interview.isAuthorized(userEmail)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { message } = req.body;
        if (!message || !message.trim()) {
            return res.status(400).json({ message: 'Message is required' });
        }

        interview.chatMessages.push({
            senderEmail: userEmail,
            senderName: req.user.name,
            message: message.trim()
        });

        await interview.save();
        res.json({ success: true });
    } catch (error) {
        console.error('Add chat message error:', error);
        res.status(500).json({ message: 'Error adding chat message' });
    }
});

/* ===========================================================
   GET CHAT HISTORY
   GET /api/interviews/:id/chat
=========================================================== */
router.get('/:id/chat', protect, async (req, res) => {
    try {
        const interview = await Interview.findById(req.params.id);

        if (!interview) {
            return res.status(404).json({ message: 'Interview not found' });
        }

        const userEmail = req.user.email.toLowerCase();
        if (!interview.isAuthorized(userEmail)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.json(interview.chatMessages);
    } catch (error) {
        console.error('Get chat history error:', error);
        res.status(500).json({ message: 'Error fetching chat history' });
    }
});

export default router;
