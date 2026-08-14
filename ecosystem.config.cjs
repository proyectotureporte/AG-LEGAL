module.exports = {
  apps: [
    {
      name: "aglegal",
      cwd: "/var/www/aglegal",
      script: "node_modules/next/dist/bin/next",
      args: "start -H 127.0.0.1 -p 4009",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "700M",
      min_uptime: "10s",
      max_restarts: 10,
      kill_timeout: 8_000,
      listen_timeout: 10_000,
      env: {
        NODE_ENV: "production",
        PORT: "4009",
      },
    },
  ],
};
