import asyncHandler from '../utils/async-handler.js';
import { processUpload } from '../services/upload-service.js';

/**
 * Handle file upload
 * POST /api/upload
 */
export const uploadFile = asyncHandler(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            error: 'No file uploaded. Please upload a CSV or XLSX file.',
        });
    }

    const result = await processUpload(req.file);

    res.status(200).json({
        success: true,
        message: 'File processed successfully',
        data: result,
    });
});
