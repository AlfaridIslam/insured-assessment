import express from 'express';
import { scheduleMessage, getScheduledMessages } from '../controllers/message.controller.js';
import { validateScheduleMessage } from '../middlewares/validator.js';

const router = express.Router();

// POST /api/messages/schedule - Schedule message for future execution
router.post('/schedule', validateScheduleMessage, scheduleMessage);

// GET /api/messages - Retrieve all scheduled messages
router.get('/', getScheduledMessages);

export default router;
