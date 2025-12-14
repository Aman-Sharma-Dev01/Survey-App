import express from 'express';
import Certificate from '../models/Certificate.js';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin email(s) allowed to access admin routes
const ADMIN_EMAILS = ['support@surveyzen.live'];

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
    if (!ADMIN_EMAILS.includes(req.user.email)) {
        return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    next();
};

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

// @desc    Verify certificate by ID (PUBLIC - for QR code scanning)
// @route   GET /api/certificates/verify/:certificateId
// @access  Public
router.get('/verify/:certificateId', async (req, res) => {
    try {
        const { certificateId } = req.params;
        
        const certificate = await Certificate.findOne({ 
            certificateId: certificateId.toUpperCase() 
        }).select('-__v');
        
        if (!certificate) {
            return res.status(404).json({ 
                verified: false,
                message: 'Certificate not found. Please check the certificate ID.' 
            });
        }
        
        if (!certificate.isValid) {
            return res.status(200).json({
                verified: false,
                message: 'This certificate has been revoked or is no longer valid.',
                certificate: {
                    certificateId: certificate.certificateId,
                    holderName: certificate.holderName,
                    position: certificate.position,
                    isValid: false
                }
            });
        }
        
        res.json({
            verified: true,
            message: 'Certificate verified successfully!',
            certificate: {
                certificateId: certificate.certificateId,
                holderName: certificate.holderName,
                email: certificate.email,
                position: certificate.position,
                department: certificate.department,
                startDate: certificate.startDate,
                endDate: certificate.endDate,
                issuedAt: certificate.issuedAt,
                description: certificate.description,
                isValid: certificate.isValid
            }
        });
    } catch (error) {
        console.error('Certificate verification error:', error);
        res.status(500).json({ 
            verified: false,
            message: 'Server error during verification' 
        });
    }
});

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

// @desc    Get all certificates (Admin only)
// @route   GET /api/certificates
// @access  Private/Admin
router.get('/', protect, isAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '' } = req.query;
        
        const query = search 
            ? { 
                $or: [
                    { holderName: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { certificateId: { $regex: search, $options: 'i' } },
                    { position: { $regex: search, $options: 'i' } }
                ]
            } 
            : {};
        
        const certificates = await Certificate.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('issuedBy', 'name email');
        
        const total = await Certificate.countDocuments(query);
        
        res.json({
            certificates,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            total
        });
    } catch (error) {
        console.error('Error fetching certificates:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get single certificate by ID (Admin only)
// @route   GET /api/certificates/:id
// @access  Private/Admin
router.get('/:id', protect, isAdmin, async (req, res) => {
    try {
        const certificate = await Certificate.findById(req.params.id)
            .populate('issuedBy', 'name email');
        
        if (!certificate) {
            return res.status(404).json({ message: 'Certificate not found' });
        }
        
        res.json(certificate);
    } catch (error) {
        console.error('Error fetching certificate:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Create a new certificate (Admin only)
// @route   POST /api/certificates
// @access  Private/Admin
router.post('/', protect, isAdmin, async (req, res) => {
    try {
        const {
            holderName,
            email,
            position,
            department,
            startDate,
            endDate,
            description
        } = req.body;
        
        // Validate required fields
        if (!holderName || !email || !position || !startDate || !endDate) {
            return res.status(400).json({ 
                message: 'Please provide all required fields: holderName, email, position, startDate, endDate' 
            });
        }
        
        // Check if user exists with this email (optional link)
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        
        const certificate = await Certificate.create({
            holderName,
            email: email.toLowerCase(),
            position,
            department: department || 'Technology',
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            description,
            issuedBy: req.user._id,
            userId: existingUser?._id || null
        });
        
        res.status(201).json({
            message: 'Certificate created successfully',
            certificate,
            verificationUrl: certificate.getVerificationUrl(),
            qrData: certificate.getQRData()
        });
    } catch (error) {
        console.error('Error creating certificate:', error);
        if (error.code === 11000) {
            return res.status(400).json({ message: 'A certificate with this ID already exists' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Update certificate (Admin only)
// @route   PUT /api/certificates/:id
// @access  Private/Admin
router.put('/:id', protect, isAdmin, async (req, res) => {
    try {
        const {
            holderName,
            email,
            position,
            department,
            startDate,
            endDate,
            description,
            isValid
        } = req.body;
        
        const certificate = await Certificate.findById(req.params.id);
        
        if (!certificate) {
            return res.status(404).json({ message: 'Certificate not found' });
        }
        
        // Update fields
        if (holderName) certificate.holderName = holderName;
        if (email) certificate.email = email.toLowerCase();
        if (position) certificate.position = position;
        if (department) certificate.department = department;
        if (startDate) certificate.startDate = new Date(startDate);
        if (endDate) certificate.endDate = new Date(endDate);
        if (description !== undefined) certificate.description = description;
        if (typeof isValid === 'boolean') certificate.isValid = isValid;
        
        await certificate.save();
        
        res.json({
            message: 'Certificate updated successfully',
            certificate,
            verificationUrl: certificate.getVerificationUrl()
        });
    } catch (error) {
        console.error('Error updating certificate:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Delete certificate (Admin only)
// @route   DELETE /api/certificates/:id
// @access  Private/Admin
router.delete('/:id', protect, isAdmin, async (req, res) => {
    try {
        const certificate = await Certificate.findById(req.params.id);
        
        if (!certificate) {
            return res.status(404).json({ message: 'Certificate not found' });
        }
        
        await certificate.deleteOne();
        
        res.json({ message: 'Certificate deleted successfully' });
    } catch (error) {
        console.error('Error deleting certificate:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Revoke/Invalidate certificate (Admin only)
// @route   PATCH /api/certificates/:id/revoke
// @access  Private/Admin
router.patch('/:id/revoke', protect, isAdmin, async (req, res) => {
    try {
        const certificate = await Certificate.findById(req.params.id);
        
        if (!certificate) {
            return res.status(404).json({ message: 'Certificate not found' });
        }
        
        certificate.isValid = false;
        await certificate.save();
        
        res.json({ 
            message: 'Certificate revoked successfully',
            certificate 
        });
    } catch (error) {
        console.error('Error revoking certificate:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Reinstate certificate (Admin only)
// @route   PATCH /api/certificates/:id/reinstate
// @access  Private/Admin
router.patch('/:id/reinstate', protect, isAdmin, async (req, res) => {
    try {
        const certificate = await Certificate.findById(req.params.id);
        
        if (!certificate) {
            return res.status(404).json({ message: 'Certificate not found' });
        }
        
        certificate.isValid = true;
        await certificate.save();
        
        res.json({ 
            message: 'Certificate reinstated successfully',
            certificate 
        });
    } catch (error) {
        console.error('Error reinstating certificate:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get certificate statistics (Admin only)
// @route   GET /api/certificates/stats/overview
// @access  Private/Admin
router.get('/stats/overview', protect, isAdmin, async (req, res) => {
    try {
        const totalCertificates = await Certificate.countDocuments();
        const validCertificates = await Certificate.countDocuments({ isValid: true });
        const revokedCertificates = await Certificate.countDocuments({ isValid: false });
        
        // Certificates issued this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        const thisMonthCertificates = await Certificate.countDocuments({
            createdAt: { $gte: startOfMonth }
        });
        
        res.json({
            total: totalCertificates,
            valid: validCertificates,
            revoked: revokedCertificates,
            thisMonth: thisMonthCertificates
        });
    } catch (error) {
        console.error('Error fetching certificate stats:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
