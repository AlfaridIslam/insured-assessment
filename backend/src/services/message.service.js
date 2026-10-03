import { ScheduledMessage } from '../models/index.js';
import { messageQueue } from '../workers/queues/messageQueue.js';

/**
 * Calculates the target execution Date and delay in milliseconds
 * Strict parsing for YYYY-MM-DD and 24-hr time (HH:MM or HH:MM:SS)
 */
export const calculateScheduledDelay = (day, time) => {
  const [hoursStr, minutesStr, secondsStr] = time.split(':');
  const hours = parseInt(hoursStr || '0', 10);
  const minutes = parseInt(minutesStr || '0', 10);
  const seconds = parseInt(secondsStr || '0', 10);

  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error('Invalid time format. Please provide time as HH:MM or HH:MM:SS (24-hour format).');
  }

  const now = new Date();
  
  // The validator guarantees 'day' is a valid YYYY-MM-DD string
  const parsedDate = new Date(day);
  if (isNaN(parsedDate.getTime())) {
    throw new Error('System Error: Invalid date passed to service layer.');
  }

  const targetDate = new Date(parsedDate);
  targetDate.setHours(hours, minutes, seconds, 0);

  if (targetDate.getTime() <= now.getTime()) {
    throw new Error(`Scheduled time must be in the future. Provided: ${targetDate.toISOString()}, Current: ${now.toISOString()}`);
  }

  const delayMs = targetDate.getTime() - now.getTime();

  return { targetDate, delayMs };
};

/**
 * Persists message and queues delayed task via BullMQ
 */
export const scheduleMessage = async ({ message, day, time }) => {
  const { targetDate, delayMs } = calculateScheduledDelay(day, time);

  // 1. Create database record
  const scheduledRecord = await ScheduledMessage.create({
    message,
    day,
    time,
    scheduledDate: targetDate,
    status: 'queued',
  });

  // 2. Add job to BullMQ with computed delay
  const job = await messageQueue.add(
    'send-scheduled-message',
    {
      messageId: scheduledRecord._id.toString(),
      message,
      scheduledDate: targetDate,
    },
    {
      delay: delayMs,
      jobId: scheduledRecord._id.toString(),
    }
  );

  // 3. Update record with BullMQ job ID
  scheduledRecord.jobId = job.id;
  await scheduledRecord.save();

  return {
    scheduledRecord,
    delayMs,
    scheduledFor: targetDate,
  };
};

export default {
  calculateScheduledDelay,
  scheduleMessage,
};