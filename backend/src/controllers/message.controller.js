import * as messageService from '../services/message.service.js';
import { ScheduledMessage } from '../models/index.js';

/**
 * Schedule a new message with day, time, and message text
 */
export const scheduleMessage = async (req, res, next) => {
  try {
    const { message, day, time } = req.body;
    const scheduleFn = messageService.scheduleMessage || messageService.default?.scheduleMessage;
    const result = await scheduleFn({ message, day, time });

    return res.status(201).json({
      success: true,
      message: 'Message successfully scheduled and queued for delivery.',
      data: {
        id: result.scheduledRecord._id,
        message: result.scheduledRecord.message,
        scheduledDate: result.scheduledFor,
        delayMs: result.delayMs,
        status: result.scheduledRecord.status,
        jobId: result.scheduledRecord.jobId,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List all scheduled messages
 */
export const getScheduledMessages = async (req, res, next) => {
  try {
    const messages = await ScheduledMessage.find().sort({ scheduledDate: -1 }).lean();

    return res.status(200).json({
      success: true,
      count: messages.length,
      data: messages,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  scheduleMessage,
  getScheduledMessages,
};
