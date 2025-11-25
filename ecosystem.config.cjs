module.exports = {
  apps: [
    {
      name: 'webosis-app',
      // Build once before starting in production. You can automate with a separate script.
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      cwd: __dirname,
      instances: 1, // change to 'max' for cluster mode if CPU >1
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      env_production: {
        NODE_ENV: 'production'
      },
      max_memory_restart: '512M',
      watch: false,
      autorestart: true,
      out_file: './logs/pm2-out.log',
      error_file: './logs/pm2-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm Z'
    }
  ]
};
