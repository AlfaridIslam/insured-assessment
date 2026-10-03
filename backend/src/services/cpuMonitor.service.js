import os from 'os';

let monitorInterval = null;

// Helper: Aggregate CPU times across all active CPU cores
const getCpuTimes = () => {
  const cpus = os.cpus();
  let idle = 0;
  let total = 0;

  for (const cpu of cpus) {
    for (const type in cpu.times) {
      total += cpu.times[type];
    }
    idle += cpu.times.idle;
  }

  return { idle, total };
};

export const startCpuMonitor = (io) => {
  // Read configuration directly from environment variables
  const threshold = parseFloat(process.env.CPU_THRESHOLD) || 70;
  const intervalMs = parseInt(process.env.CPU_CHECK_INTERVAL_MS, 10) || 3000;

  let startUsage = getCpuTimes();

  monitorInterval = setInterval(() => {
    const endUsage = getCpuTimes();
    const idleDiff = endUsage.idle - startUsage.idle;
    const totalDiff = endUsage.total - startUsage.total;

    // Calculate percentage load across sample window
    const usagePercent = totalDiff > 0 
      ? 100 - Math.round((100 * idleDiff) / totalDiff) 
      : 0;

    startUsage = endUsage;

    // Stream real-time metrics to UI clients if socket is active
    if (io) {
      io.emit('cpu_telemetry', {
        usage: usagePercent,
        threshold,
        timestamp: new Date().toISOString(),
      });
    }

    // Trigger process restart if threshold is reached
    if (usagePercent >= threshold) {
      console.error(
        `🚨 CRITICAL: CPU usage reached ${usagePercent}% (Threshold: ${threshold}%). Exiting process for restart.`
      );
      process.exit(1);
    }
  }, intervalMs);

  console.log(`⏱️ CPU Monitor active: sampling every ${intervalMs}ms (Threshold: ${threshold}%)`);
};

export const stopCpuMonitor = () => {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
    console.log('🛑 CPU Monitor stopped.');
  }
};