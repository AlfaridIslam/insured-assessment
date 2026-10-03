/**
 * Vyomi Service Simulation
 * Simulates external integration service (e.g. messaging / policy dispatcher)
 */

export const vyomiConfig = {
  enabled: process.env.VYOMI_SIMULATION_ENABLED === 'true',
  latencyMs: parseInt(process.env.VYOMI_SIMULATION_LATENCY_MS || '100', 10),
  endpoint: process.env.VYOMI_ENDPOINT || 'https://api.simulation.vyomi.internal/v1',
};

/**
 * Simulates dispatching a message or policy sync through the Vyomi platform
 * @param {Object} payload
 * @returns {Promise<{ success: boolean, transactionId: string, timestamp: Date }>}
 */
export const dispatchToVyomi = async (payload) => {
  if (!vyomiConfig.enabled) {
    return {
      success: true,
      simulation: false,
      message: 'Vyomi simulation is disabled',
      timestamp: new Date(),
    };
  }

  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, vyomiConfig.latencyMs));

  const transactionId = `VYOMI-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  console.log(`[Vyomi Simulation] Message dispatched successfully: [${transactionId}]`, {
    target: payload.recipient || payload.user || 'general',
    message: payload.message || payload.body,
    scheduledTime: payload.scheduledTime,
  });

  return {
    success: true,
    simulation: true,
    transactionId,
    timestamp: new Date(),
  };
};

export default {
  vyomiConfig,
  dispatchToVyomi,
};
