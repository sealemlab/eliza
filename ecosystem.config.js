module.exports = {
    apps: [
        {
            name: "eliza",
            script: "pnpm",
            args: 'start --character="characters/xingye.character.json,characters/kol.FannyDobbi92148.json,characters/kol.SetllaM77019.json,characters/kol.AbrahamRog71525.json,characters/kol.adelaide60990.json,characters/kol.sonmerfiel68723.json,characters/kol.EugeneWalp68754.json"',
            autorestart: true,
            max_restarts: 5,
            min_uptime: "10s",
            restart_delay: 5000,
            out_file: "logs/eliza/normal.log",
            error_file: "logs/eliza/error.log",
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
            out_file: "logs/eliza-client/normal.log",
            error_file: "logs/eliza-client/error.log",
            combine_logs: true,
        },
    ],
};
