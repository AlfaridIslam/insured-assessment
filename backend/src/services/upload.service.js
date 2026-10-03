import { Worker } from 'worker_threads';
import path from 'path';

export const processCsvInWorker = (filePath) => {
  return new Promise((resolve, reject) => {
    // We will create this worker file in the next step
    const workerPath = path.resolve('./src/workers/threads/csvWorker.js');
    
    const worker = new Worker(workerPath, {
      workerData: { filePath }
    });

    worker.on('message', (message) => {
      if (message.status === 'success') {
        resolve(message);
      } else if (message.status === 'progress') {
        // We will wire this to Socket.io later for real-time updates
        console.log(`Worker Progress: ${message.percent}%`);
      }
    });

    worker.on('error', (error) => {
      console.error('Worker Thread Error:', error);
      reject(error);
    });

    worker.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
};