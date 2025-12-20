import express from 'express';
import { sendContactEmail, sendContactConfirmationEmail } from '../utils/emailService.js';

const router = express.Router();

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

        // Send email to admin/support
        await sendContactEmail({
            name,
            email,
            subject: subject || 'General Inquiry',
            message
        });

        // Send confirmation email to user
        await sendContactConfirmationEmail(email, name);

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

export default router;
