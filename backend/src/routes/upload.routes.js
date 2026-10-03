import express from 'express';
import upload from '../middlewares/upload.middleware.js';
import { uploadCsv } from '../controllers/upload.controller.js';

const router = express.Router();

// POST /api/upload - Upload and parse CSV via Worker Thread
router.post('/', upload.single('file'), uploadCsv);

export default router;
