import express from 'express';
import { sendContactEmail, sendContactConfirmationEmail } from '../utils/emailService.js';
import Contact from '../models/Contact.js';
import { protect } from '../middleware/authMiddleware.js';
import User from '../models/User.js';

const router = express.Router();

// Admin check middleware
const isAdmin = async (req, res, next) => {
    try {
        // Check if user is admin (you can add an isAdmin field to User model, or check by email)
        const adminEmails = ['contact@surveyzen.live', 'admin@surveyzen.live', 'support@surveyzen.live', 'vermashivamsf@gmail.com'];
        if (adminEmails.includes(req.user.email.toLowerCase())) {
            next();
        } else {
            res.status(403).json({ message: 'Admin access required' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error checking admin status' });
    }
};

/* ===========================================================
   SUBMIT CONTACT FORM
   POST /api/contact (Public)
=========================================================== */
router.post('/', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        // Validate required fields
        if (!name || !email || !message) {
            return res.status(400).json({ 
                success: false, 
                message: 'Name, email, and message are required' 
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide a valid email address' 
            });
        }

        // Save to database first (this always works)
        const contactSubmission = await Contact.create({
            name,
            email,
            subject: subject || 'General Inquiry',
            message
        });
        console.log('Contact form saved to database:', contactSubmission._id);

        // Try to send emails (don't fail if email fails)
        try {
            await sendContactEmail({
                name,
                email,
                subject: subject || 'General Inquiry',
                message
            });
        } catch (emailError) {
            console.error('Failed to send admin email:', emailError.message);
        }

        try {
            await sendContactConfirmationEmail(email, name);
        } catch (emailError) {
            console.error('Failed to send confirmation email:', emailError.message);
        }

        res.status(200).json({ 
            success: true, 
            message: 'Your message has been sent successfully. We will get back to you soon!' 
        });

    } catch (error) {
        console.error('Contact form error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to send message. Please try again later.' 
        });
    }
});

/* ===========================================================
   GET ALL CONTACT SUBMISSIONS (Admin only)
   GET /api/contact/admin
=========================================================== */
router.get('/admin', protect, isAdmin, async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        
        const query = {};
        if (status && status !== 'all') {
            query.status = status;
        }

        const contacts = await Contact.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Contact.countDocuments(query);
        const newCount = await Contact.countDocuments({ status: 'new' });

        res.json({
            success: true,
            contacts,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            },
            newCount
        });
    } catch (error) {
        console.error('Error fetching contacts:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch contacts' });
    }
});

/* ===========================================================
   UPDATE CONTACT STATUS (Admin only)
   PATCH /api/contact/admin/:id
=========================================================== */
router.patch('/admin/:id', protect, isAdmin, async (req, res) => {
    try {
        const { status, notes } = req.body;
        
        const updateData = {};
        if (status) updateData.status = status;
        if (notes !== undefined) updateData.notes = notes;
        if (status === 'replied') {
            updateData.repliedAt = new Date();
            updateData.repliedBy = req.user._id;
        }

        const contact = await Contact.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!contact) {
            return res.status(404).json({ success: false, message: 'Contact not found' });
        }

        res.json({ success: true, contact });
    } catch (error) {
        console.error('Error updating contact:', error);
        res.status(500).json({ success: false, message: 'Failed to update contact' });
    }
});

/* ===========================================================
   DELETE CONTACT (Admin only)
   DELETE /api/contact/admin/:id
=========================================================== */
router.delete('/admin/:id', protect, isAdmin, async (req, res) => {
    try {
        const contact = await Contact.findByIdAndDelete(req.params.id);
        
        if (!contact) {
            return res.status(404).json({ success: false, message: 'Contact not found' });
        }

        res.json({ success: true, message: 'Contact deleted successfully' });
    } catch (error) {
        console.error('Error deleting contact:', error);
        res.status(500).json({ success: false, message: 'Failed to delete contact' });
    }
});

export default router;
