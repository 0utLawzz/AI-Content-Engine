# Deployment Guide — AI Content Engine

---

## Option 1: Replit (Current Host — Recommended for Quick Deploy)

This project was built on Replit and deploys there with one click.

### Steps

1. Open the project on Replit
2. Click **Deploy** in the top-right corner
3. Select **Autoscale** (recommended) or **Reserved VM**
4. Set the following environment variables in the Replit Secrets panel:
   - `DATABASE_URL` — auto-set if you use the Replit PostgreSQL integration
   - `SESSION_SECRET` — a random string (generate with `openssl rand -hex 32`)
   - Any AI provider keys needed for Phase 2 (OPENAI_API_KEY, etc.)
5. Click **Deploy**

### After Deploying

- Your app will be live at `https://your-app-name.replit.app`
- The API is accessible at `https://your-app-name.replit.app/api`
- Database is the same Replit PostgreSQL instance — it persists across deploys

### Replit-Specific Notes

- The app uses path-based routing: frontend on `/`, API on `/api`
- Ports are managed by Replit automatically via the `PORT` env var
- Do not hardcode ports in any service

---

## Option 2: Railway

Railway is the closest to Replit's one-click experience for full-stack apps with PostgreSQL.

### Steps

1. Push the repo to GitHub
2. Go to [railway.app](https://railway.app) and create a new project
3. **Add a PostgreSQL service** — Railway creates one and sets `DATABASE_URL` automatically
4. **Add a service** pointing at your GitHub repo
5. Set build command: `pnpm install && pnpm --filter @workspace/db run push && pnpm --filter @workspace/api-server run build`
6. Set start command: `node artifacts/api-server/dist/index.mjs`
7. Set environment variables:
   ```
   PORT=8080
   NODE_ENV=production
   SESSION_SECRET=<random>
   DATABASE_URL=<from Railway PostgreSQL service>
   ```
8. For the frontend: add a second service or deploy it to Vercel (see below)

---

## Option 3: Render

### API Server on Render

1. Create a **Web Service** on [render.com](https://render.com)
2. Connect your GitHub repo
3. Set:
   - **Build command:** `pnpm install && pnpm --filter @workspace/api-server run build`
   - **Start command:** `node artifacts/api-server/dist/index.mjs`
   - **Environment:** Node
4. Add a **PostgreSQL** database on Render, copy the connection string
5. Set environment variables: `DATABASE_URL`, `PORT=10000`, `NODE_ENV=production`, `SESSION_SECRET`

### Frontend on Vercel (or Render Static Site)

1. Create a **Static Site** on Render (or a project on [vercel.com](https://vercel.com))
2. Set:
   - **Build command:** `pnpm --filter @workspace/content-engine run build`
   - **Output directory:** `artifacts/content-engine/dist`
3. Set environment variable: `VITE_API_BASE_URL=https://your-api-url.onrender.com`
4. Update `lib/api-client-react` axios base URL to use this env var in production

---

## Option 4: VPS / Self-Hosted (Ubuntu 22.04+)

### Prerequisites

```bash
# Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# pnpm
npm install -g pnpm

# PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib
sudo -u postgres createdb ai_content_engine
```

### Deploy

```bash
# Clone
git clone https://github.com/YOUR_USERNAME/ai-content-engine.git
cd ai-content-engine

# Install
pnpm install

# Set environment
export DATABASE_URL="postgresql://postgres:password@localhost:5432/ai_content_engine"
export NODE_ENV=production
export PORT=8080
export SESSION_SECRET="$(openssl rand -hex 32)"

# Push schema
pnpm --filter @workspace/db run push

# Build
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/content-engine run build

# Run with PM2
npm install -g pm2
pm2 start artifacts/api-server/dist/index.mjs --name api-server
pm2 save
pm2 startup
```

### Nginx Config (serves frontend + proxies API)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /path/to/ai-content-engine/artifacts/content-engine/dist;
    index index.html;

    location /api {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable HTTPS with Certbot:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `PORT` | Yes | Port for API server (default 8080) |
| `NODE_ENV` | Yes | `production` for deployed apps |
| `SESSION_SECRET` | Yes | Random string for session signing |
| `OPENAI_API_KEY` | Phase 2 | OpenAI API key for AI orchestrator |
| `GOOGLE_AI_API_KEY` | Phase 2 | Gemini API key |
| `ANTHROPIC_API_KEY` | Phase 2 | Claude API key |
| `ELEVENLABS_API_KEY` | Phase 2 | ElevenLabs voice synthesis |

---

## Production Checklist

- [ ] `NODE_ENV=production` is set
- [ ] `SESSION_SECRET` is a random 32+ character string
- [ ] `DATABASE_URL` points to a production database
- [ ] DB schema has been pushed: `pnpm --filter @workspace/db run push`
- [ ] API server builds without errors: `pnpm --filter @workspace/api-server run build`
- [ ] Frontend builds without errors: `pnpm --filter @workspace/content-engine run build`
- [ ] HTTPS is enabled on your domain
- [ ] Database backups are configured
- [ ] `/api/healthz` returns `{"status":"ok"}` after deploy

---

## Updating a Deployed App

```bash
git pull origin main
pnpm install
pnpm --filter @workspace/db run push    # only if schema changed
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/content-engine run build
pm2 restart api-server    # if using PM2
```
