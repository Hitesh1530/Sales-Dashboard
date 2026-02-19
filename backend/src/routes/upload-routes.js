import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import { uploadFile } from '../controllers/upload-controller.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '..', '..', '..', 'uploads');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const suffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'products-' + suffix + path.extname(file.originalname));
    },
});

const fileFilter = (req, file, cb) => {
    const allowed = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    // Also allow by extension since some CSV files have wrong MIME
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(file.mimetype) || ['.csv', '.xlsx', '.xls'].includes(ext)) {
        cb(null, true);
    } else {
        cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'file'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Rate limit: max 10 uploads per 15 minutes per IP
const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { success: false, error: 'Too many upload requests. Please wait 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * POST /api/upload
 * Multer errors are converted to 400 in the route-level error handler below
 */
router.post(
    '/',
    uploadLimiter,
    (req, res, next) => {
        upload.single('file')(req, res, (err) => {
            if (err) {
                // Return 400 for all multer errors (wrong type, too large)
                const message =
                    err.code === 'LIMIT_FILE_SIZE' ? 'File too large. Maximum size is 10MB.' :
                        err.code === 'LIMIT_UNEXPECTED_FILE' ? 'Invalid file type. Only CSV and XLSX files are allowed.' :
                            err.message || 'File upload error.';
                return res.status(400).json({ success: false, error: message });
            }
            next();
        });
    },
    uploadFile
);

export default router;
