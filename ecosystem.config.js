module.exports = {
    apps: [
        {
            name: "eliza-xingye",
            script: "pnpm",
            args: 'start --characters="characters/xingye.character.json"',
            autorestart: true,
            max_restarts: 5,
            min_uptime: "10s",
            restart_delay: 5000,
            out_file: "logs/eliza-xingye/normal.log",
            error_file: "logs/eliza-xingye/error.log",
            combine_logs: true,
        },
    ],
};
