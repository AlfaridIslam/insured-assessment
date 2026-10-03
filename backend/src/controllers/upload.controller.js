import path from 'path';
import { processCsvInWorker } from '../services/upload.service.js';

/**
 * Handles CSV upload and offloads parsing to a Node.js Worker Thread
 */
export const uploadCsv = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please upload a CSV file with key "file".',
      });
    }

    const filePath = path.resolve(req.file.path);

    // Offload CSV parsing to background worker thread without blocking response
    processCsvInWorker(filePath)
      .then((result) => {
        console.log(`✅ CSV import worker completed:`, result);
      })
      .catch((err) => {
        console.error(`❌ CSV import worker error:`, err.message);
      });

    return res.status(202).json({
      success: true,
      message: 'File uploaded successfully. Processing started in background worker thread.',
      file: {
        originalName: req.file.originalname,
        size: req.file.size,
        tempPath: req.file.path,
      },
    });
  } catch (error) {
    next(error);
  }
};

export default {
  uploadCsv,
};
