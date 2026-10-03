import { Queue } from 'bullmq';
import { redisOptions } from '../../config/redis.js';

export const MESSAGE_QUEUE_NAME = 'scheduled-message-queue';

export const messageQueue = new Queue(MESSAGE_QUEUE_NAME, {
  connection: redisOptions,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

export default {
  MESSAGE_QUEUE_NAME,
  messageQueue,
};
