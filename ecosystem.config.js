module.exports = {
  apps: [
    {
      name: 'dailygoodnews-frontend',
      script: '/home/ubuntu/git/dailygoodnews-frontend/.venv/bin/gunicorn',
      args: '-w 3 src.app:app -b localhost:8000',
      interpreter: 'none',
      cwd: '/home/ubuntu/git/dailygoodnews-frontend',
      env: {
        PATH: `/home/ubuntu/git/dailygoodnews-frontend/.venv/bin:${process.env.PATH}`,
        PYTHONPATH: '/home/ubuntu/git/dailygoodnews-frontend',
      },
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
    },
  ],
};