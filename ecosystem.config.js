module.exports = {
    apps: [
        {
            name: "eliza",
            script: "pnpm",
            args: 'start --character="characters/kol.adelaide60990.json,characters/kol.sonmerfiel68723.json,characters/kol.EugeneWalp68754.json"',
            autorestart: true,
            max_restarts: 5,
            min_uptime: "10s",
            restart_delay: 5000,
            out_file: "logs/eliza-kol/normal.log",
            error_file: "logs/eliza-kol/error.log",
            combine_logs: true,
        },
        {
            name: "eliza-client",
            script: "pnpm",
            args: "start:client",
            autorestart: true,
            max_restarts: 5,
            min_uptime: "10s",
            restart_delay: 5000,
            out_file: "logs/eliza-client-kol/normal.log",
            error_file: "logs/eliza-client-kol/error.log",
            combine_logs: true,
        },
    ],
};
