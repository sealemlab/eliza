module.exports = {
  apps: [
    {
      name: 'eliza',
      script: 'pnpm',
      args: 'start --character="characters/cryptomaddoc.character.json,characters/cryptochili.character.json"',
      autorestart: true,
      max_restarts: 5,
      min_uptime: '10s',
      restart_delay: 5000,
      out_file: 'logs/eliza/normal.log',
      error_file: 'logs/eliza/error.log',
      combine_logs: true,
    },
    {
      name: 'eliza-client',
      script: 'pnpm',
      args: 'start:client',
      autorestart: true,
      max_restarts: 5,
      min_uptime: '10s',
      restart_delay: 5000,
      out_file: 'logs/eliza-client/normal.log',
      error_file: 'logs/eliza-client/error.log',
      combine_logs: true,
    },
  ]
};