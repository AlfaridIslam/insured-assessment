import express from 'express';
import uploadRoutes from './upload.routes.js';
import policyRoutes from './policy.routes.js';
import messageRoutes from './message.routes.js';
import monitorRoutes from './monitor.routes.js';
import searchRoutes from './search.routes.js';

const router = express.Router();

// Health Check Endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    uptime: process.uptime(),
    timestamp: new Date(),
  });
});

// Mount modular sub-routers
router.use('/upload', uploadRoutes);
router.use('/policies', policyRoutes);
router.use('/messages', messageRoutes);
router.use('/monitor', monitorRoutes);
router.use('/search', searchRoutes);

export default router;
