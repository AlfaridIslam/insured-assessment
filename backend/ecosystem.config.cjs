module.exports = {
  apps: [
    {
      name: 'insuredmine-api',
      script: './src/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
        CPU_THRESHOLD: 70,
        CPU_CHECK_INTERVAL_MS: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
        CPU_THRESHOLD: 70,
        CPU_CHECK_INTERVAL_MS: 3000,
      },
    },
  ],
};
