module.exports = {
  apps: [
    {
      name: 'dailygoodnews-frontend',
      script: 'gunicorn',
      args: '-w 3 src.app:app -b localhost:8000',
      interpreter: '/home/ubuntu/git/dailygoodnews-frontend/.venv/bin/python',
      cwd: '/home/ubuntu/git/dailygoodnews-frontend',
      env: {
        PATH: '/home/ubuntu/git/dailygoodnews-frontend/.venv/bin:$PATH',
      },
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
    },
  ],
};
