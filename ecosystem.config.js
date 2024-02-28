module.exports = 
{
    apps: 
    [
      {
        name: 'online-voting',
        script: 'index.js',
        instances: 'max',
        exec_mode: 'cluster',
        out_file: 'pm2.log',
        error_file: 'error.log',
        env: {
          NODE_ENV: 'production',
          PORT: process.env.PORT || 3000,
        },
      },
    ],
};
  