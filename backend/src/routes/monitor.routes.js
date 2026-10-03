import express from 'express';
import { getCpuStatus } from '../controllers/monitor.controller.js';

const router = express.Router();

// GET /api/monitor/cpu - Current CPU utilization
router.get('/cpu', getCpuStatus);

export default router;
