import 'dotenv/config';
import http from 'http';
import mongoose from 'mongoose';
import app from './app.js';
import connectDB from './config/db.js';
import { initSocket } from './config/socket.js';
import { startCpuMonitor, stopCpuMonitor } from './services/cpuMonitor.service.js';
import { initMessageWorker } from './workers/queues/messageWorker.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    const server = http.createServer(app);
    const io = initSocket(server);

    let messageWorker = null;
    try {
      messageWorker = initMessageWorker();
    } catch (queueErr) {
      console.warn('⚠️ BullMQ worker could not connect to Redis:', queueErr.message);
    }

    startCpuMonitor(io);

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📑 Swagger Documentation: http://localhost:${PORT}/api/docs`);
    });

    const handleShutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}. Shutting down...`);
      stopCpuMonitor();

      if (messageWorker && typeof messageWorker.close === 'function') {
        await messageWorker.close();
      }

      server.close(async () => {
        try {
          await mongoose.connection.close();
          process.exit(0);
        } catch (dbErr) {
          process.exit(1);
        }
      });

      setTimeout(() => {
        console.error('⚠️ Shutdown timed out. Forcing process exit.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
  } catch (error) {
    console.error('❌ Fatal Server Startup Error:', error);
    process.exit(1);
  }
};

startServer();