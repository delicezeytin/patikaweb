module.exports = {
    apps: [{
        name: 'patika-api',
        script: 'dist/index.js',
        cwd: '/home/runcloud/webapps/patika-api',
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '256M',
        env: {
            NODE_ENV: 'production',
            PORT: 3001
        }
    }]
};
