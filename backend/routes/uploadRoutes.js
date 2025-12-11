import express from 'express';
import multer from 'multer';
import cloudinary from '../config/cloudinary.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Configure multer for memory storage (we'll upload directly to Cloudinary)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

/* ===========================================================
   UPLOAD SINGLE IMAGE
   POST /api/upload/image (Private)
=========================================================== */
router.post('/image', protect, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image file provided' });
        }

        // Convert buffer to base64
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(dataURI, {
            folder: 'surveyzen/quizzes',
            resource_type: 'image',
            transformation: [
                { width: 1200, crop: 'limit' }, // Limit max width
                { quality: 'auto:good' },
                { fetch_format: 'auto' }
            ]
        });

        res.json({
            success: true,
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ 
            message: 'Error uploading image', 
            error: error.message 
        });
    }
});

/* ===========================================================
   DELETE IMAGE
   DELETE /api/upload/image/:publicId (Private)
=========================================================== */
router.delete('/image/:publicId', protect, async (req, res) => {
    try {
        const publicId = decodeURIComponent(req.params.publicId);
        
        const result = await cloudinary.uploader.destroy(publicId);
        
        if (result.result === 'ok') {
            res.json({ success: true, message: 'Image deleted successfully' });
        } else {
            res.status(400).json({ success: false, message: 'Failed to delete image' });
        }
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ 
            message: 'Error deleting image', 
            error: error.message 
        });
    }
});

export default router;
