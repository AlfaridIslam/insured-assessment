import { Worker } from 'bullmq';
import { redisOptions } from '../../config/redis.js';
import { MESSAGE_QUEUE_NAME } from './messageQueue.js';
import { ScheduledMessage } from '../../models/index.js';
import { dispatchToVyomi } from '../../config/vyomi.js';

let workerInstance = null;

/**
 * Initializes BullMQ worker to consume scheduled message tasks
 */
export const initMessageWorker = () => {
  if (workerInstance) {
    return workerInstance;
  }

  workerInstance = new Worker(
    MESSAGE_QUEUE_NAME,
    async (job) => {
      const { messageId, message, scheduledDate } = job.data;
      console.log(`📨 [BullMQ Worker] Processing message [ID: ${messageId}] at ${new Date().toISOString()}`);

      try {
        // 1. Dispatch through Vyomi simulation service
        const vyomiResult = await dispatchToVyomi({
          message,
          scheduledTime: scheduledDate,
        });

        // 2. Update Database Record
        await ScheduledMessage.findByIdAndUpdate(messageId, {
          status: 'sent',
          sentAt: new Date(),
        });

        console.log(`✅ [BullMQ Worker] Message [ID: ${messageId}] dispatched successfully! Tx: ${vyomiResult.transactionId}`);
        return { success: true, vyomiResult };
      } catch (error) {
        console.error(`❌ [BullMQ Worker] Failed to send message [ID: ${messageId}]:`, error.message);

        await ScheduledMessage.findByIdAndUpdate(messageId, {
          status: 'failed',
          failureReason: error.message,
        });

        throw error;
      }
    },
    {
      connection: redisOptions,
      concurrency: 5,
    }
  );

  workerInstance.on('completed', (job) => {
    console.log(`🎉 Job ${job.id} completed successfully.`);
  });

  workerInstance.on('failed', (job, err) => {
    console.error(`💥 Job ${job?.id} failed with error:`, err.message);
  });

  workerInstance.on('error', (err) => {
    console.error('BullMQ Worker Error:', err.message);
  });

  console.log('✅ BullMQ Message Worker initialized');
  return workerInstance;
};

export default {
  initMessageWorker,
};
