import os from 'os';

/**
 * Returns instantaneous CPU and memory metrics
 */
export const getCpuStatus = async (req, res, next) => {
  try {
    const cpus = os.cpus();
    const freeMem = os.freemem();
    const totalMem = os.totalmem();
    const usedMem = totalMem - freeMem;

    let idle = 0;
    let total = 0;
    for (const cpu of cpus) {
      for (const type in cpu.times) {
        total += cpu.times[type];
      }
      idle += cpu.times.idle;
    }

    const cpuUsagePercent = total > 0 ? parseFloat((100 - (100 * idle) / total).toFixed(2)) : 0;
    const threshold = parseFloat(process.env.CPU_THRESHOLD || '70');

    return res.status(200).json({
      success: true,
      data: {
        cpuPercent: cpuUsagePercent,
        memoryMb: parseFloat((usedMem / 1024 / 1024).toFixed(2)),
        totalMemoryMb: parseFloat((totalMem / 1024 / 1024).toFixed(2)),
        uptimeSeconds: Math.floor(os.uptime()),
        thresholdPercent: threshold,
        isOverThreshold: cpuUsagePercent >= threshold,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getCpuStatus,
};
