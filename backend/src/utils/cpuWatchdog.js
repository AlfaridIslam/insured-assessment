import os from 'os';

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

export const startCpuWatchdog = () => {
  const threshold = parseInt(process.env.CPU_THRESHOLD, 10) || 70;
  const intervalMs = parseInt(process.env.CPU_CHECK_INTERVAL_MS, 10) || 3000;

  let previous = getCpuTimes();
  console.log(`🛡️  CPU Watchdog active: monitoring every ${intervalMs}ms at ${threshold}% ceiling`);

  setInterval(() => {
    const current = getCpuTimes();

    const idleDelta = current.idle - previous.idle;
    const totalDelta = current.total - previous.total;

    if (totalDelta > 0) {
      const cpuUsage = Math.round(100 - (100 * idleDelta) / totalDelta);

      if (cpuUsage > threshold) {
        console.error(`🚨 CPU spike detected: ${cpuUsage}% (exceeds ${threshold}% limit)`);
        console.error(`🚨 Terminating process via process.exit(1) to trigger orchestrator restart.`);
        process.exit(1);
      }
    }

    previous = current;
  }, intervalMs);
};

export default startCpuWatchdog;