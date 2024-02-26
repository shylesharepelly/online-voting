module.exports = {
    apps: [
      {
        name: 'online-voting',
        script: 'index.js',
        instances: 'max',
        exec_mode: 'cluster',
        env: {
          NODE_ENV: 'production',
          PORT: process.env.PORT || 3000,
        },
      },
    ],
  };
  