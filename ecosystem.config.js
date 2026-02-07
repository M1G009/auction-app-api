module.exports = {
    apps: [
      {
        name: "auction-server",
        script: "./bin/www",
        cwd: "/var/www/auction-app/server",
        exec_mode: "fork",
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: "512M",
  
        env: {
          NODE_ENV: "production",
          PORT: 7002
        },
  
        error_file: "/var/log/pm2/auction-server-error.log",
        out_file: "/var/log/pm2/auction-server-out.log",
        log_date_format: "YYYY-MM-DD HH:mm:ss"
      }
    ]
  };
  