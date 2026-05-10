// PM2 Ecosystem Config — LifeOS Backend
// Location on VPS: /home/ubuntu/lifeos-nexus-v2/lifeos/backend/ecosystem.config.js

module.exports = {
  apps: [
    {
      name: "lifeos-backend",
      script: "/home/ubuntu/lifeos-nexus-v2/lifeos/backend/venv/bin/uvicorn",
      args: "app.main:app --host 0.0.0.0 --port 8000 --workers 2",
      cwd: "/home/ubuntu/lifeos-nexus-v2/lifeos/backend",
      interpreter: "none",          // uvicorn is the interpreter
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        PYTHONUNBUFFERED: "1",
        // All secrets come from .env file — do NOT hardcode here
      },
      error_file: "/home/ubuntu/logs/lifeos-backend-error.log",
      out_file:   "/home/ubuntu/logs/lifeos-backend-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};