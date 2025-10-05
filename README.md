# dailygoodnews-frontend

## Setup
1. Install `uv`

2. Then: 
```bash
uv venv .venv
source .venv/bin/activate
uv sync
```

## Run the application locally
```bash
uv run ./src/app.py
```

# PRODUCTION:

## Run the application on the prod server
```bash
pm2 start ecosystem.config.js 
```

## Renew the certification
```bash
sudo certbot --nginx -d www.dailygoodnews.co.uk
```

## GOOGLE Search Console
To collect statistics and get indexed by Google, visit this [site](https://search.google.com/search-console?resource_id=https://www.dailygoodnews.co.uk/).