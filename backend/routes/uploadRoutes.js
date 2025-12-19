import express from 'express';
import multer from 'multer';
import cloudinary from '../config/cloudinary.js';
import { protect } from '../middleware/authMiddleware.js';
import mammoth from 'mammoth';
import { createRequire } from 'module';

const router = express.Router();

// Use createRequire for CommonJS modules like pdf-parse
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

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

// File filter for documents (PDF, Word)
const documentFilter = (req, file, cb) => {
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
    ];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only PDF, Word (.doc, .docx), and text files are allowed!'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

const documentUpload = multer({
    storage,
    fileFilter: documentFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit for documents
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

/* ===========================================================
   PARSE DOCUMENT (PDF, Word, Text)
   POST /api/upload/document (Private)
   Extracts text content from uploaded documents for AI processing
=========================================================== */
router.post('/document', protect, documentUpload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No document file provided' });
        }

        let extractedText = '';
        const fileName = req.file.originalname;
        const mimeType = req.file.mimetype;

        // Parse PDF files
        if (mimeType === 'application/pdf') {
            try {
                const pdfData = await pdfParse(req.file.buffer);
                extractedText = pdfData.text;
            } catch (pdfError) {
                console.error('PDF parsing error:', pdfError);
                return res.status(400).json({ 
                    message: 'Error parsing PDF file. The file may be corrupted or password-protected.',
                    error: pdfError.message 
                });
            }
        }
        // Parse Word documents (.docx)
        else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            try {
                const result = await mammoth.extractRawText({ buffer: req.file.buffer });
                extractedText = result.value;
            } catch (docxError) {
                console.error('DOCX parsing error:', docxError);
                return res.status(400).json({ 
                    message: 'Error parsing Word document.',
                    error: docxError.message 
                });
            }
        }
        // Parse older Word documents (.doc) - mammoth has limited support
        else if (mimeType === 'application/msword') {
            try {
                const result = await mammoth.extractRawText({ buffer: req.file.buffer });
                extractedText = result.value;
            } catch (docError) {
                console.error('DOC parsing error:', docError);
                return res.status(400).json({ 
                    message: 'Error parsing Word document. Try saving it as .docx format.',
                    error: docError.message 
                });
            }
        }
        // Parse plain text files
        else if (mimeType === 'text/plain') {
            extractedText = req.file.buffer.toString('utf-8');
        }
        else {
            return res.status(400).json({ message: 'Unsupported file type' });
        }

        // Clean up the extracted text
        extractedText = extractedText
            .replace(/\r\n/g, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .trim();

        // Limit text length to prevent huge payloads (max 50,000 chars)
        const maxLength = 50000;
        const isTruncated = extractedText.length > maxLength;
        if (isTruncated) {
            extractedText = extractedText.substring(0, maxLength) + '...';
        }

        res.json({
            success: true,
            fileName,
            mimeType,
            textLength: extractedText.length,
            isTruncated,
            content: extractedText
        });
    } catch (error) {
        console.error('Document parsing error:', error);
        res.status(500).json({ 
            message: 'Error processing document', 
            error: error.message 
        });
    }
});

export default router;
