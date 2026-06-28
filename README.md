# AI Content Engine

A modular, commercial-grade video content generation platform for creators and studios. Produce short-form video content at scale — motivational quotes, business tips, science facts, kids stories — packaged into polished reels for Instagram, TikTok, and YouTube Shorts.

![Social Preview](social-preview.svg)

---

## Features

- **14 Content Plugins** — Quotes, Stoic Wisdom, Business Tips, Science Facts, Kids Stories, Psychology, Health, and more
- **Multi-Engine Voice** — Browser TTS, OpenAI, ElevenLabs, Google Cloud, Azure Neural (abstract provider system)
- **Animation Presets** — Luxury, Modern, Corporate, Minimal, Energetic, Kids, Cinematic, Dark, Neon
- **Camera Engine** — Push In/Out, Pan, Orbit, Parallax, Zoom, Shake
- **Music Engine** — Background music with mood presets and auto-ducking
- **Subtitle Engine** — Sentence, Word Highlight, Karaoke, Animated modes
- **Background Engine** — Gradient, Particles, Animated Shapes, Glassmorphism, 3D Space, Video
- **Bulk Generator** — CSV / JSON / Manual input → hundreds of videos automatically
- **Multi-Platform Export** — Instagram Reels, YouTube Shorts, TikTok, Facebook Reels, Landscape, Square
- **Live Scene Preview** — Animated mockup renderer with real camera + subtitle simulation
- **Brand System** — Logo, watermark, tagline, colors, end cards

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS v4, shadcn/ui, TanStack Query |
| Backend | Express 5, Node.js 24, TypeScript 5.9 |
| Database | PostgreSQL + Drizzle ORM |
| Validation | Zod v4, drizzle-zod |
| API Contract | OpenAPI 3.1, Orval codegen |
| Package Manager | pnpm workspaces |
| Build | esbuild (API), Vite (frontend) |

---

## Repository Structure

```
ai-content-engine/
├── artifacts/
│   ├── api-server/          # Express API — routes, middleware, entry point
│   │   └── src/
│   │       ├── routes/      # One file per resource (projects, scenes, plugins, …)
│   │       ├── lib/         # Logger, db, shared utilities
│   │       └── app.ts       # Express app wiring
│   └── content-engine/      # React frontend
│       └── src/
│           ├── pages/       # Route-level components
│           ├── components/  # Reusable UI components
│           │   └── ui/      # shadcn/ui primitives (do not edit)
│           └── App.tsx      # Router and providers
├── lib/
│   ├── api-spec/            # openapi.yaml — source of truth for all API contracts
│   ├── api-client-react/    # Generated hooks (do not edit by hand)
│   ├── api-zod/             # Generated Zod schemas (do not edit by hand)
│   └── db/
│       └── src/schema/      # Drizzle table definitions
├── scripts/                 # Shared utility scripts
├── social-preview.svg       # GitHub repository social card
├── pnpm-workspace.yaml      # Workspace config and catalog pins
└── tsconfig.base.json       # Shared TypeScript config
```

---

## Prerequisites

- **Node.js** 20+ (24 recommended)
- **pnpm** 9+ — install with `npm install -g pnpm`
- **PostgreSQL** 15+ running locally (or a hosted instance)

---

## Clone & Install

```bash
# 1. Clone
git clone https://github.com/YOUR_USERNAME/ai-content-engine.git
cd ai-content-engine

# 2. Install all workspace dependencies
pnpm install
```

---

## Environment Setup

Create a `.env` file at the **root** of the repository (never commit it):

```env
# Required
DATABASE_URL=postgresql://user:password@localhost:5432/ai_content_engine

# Optional — AI providers (Phase 2)
OPENAI_API_KEY=sk-...
GOOGLE_AI_API_KEY=...
ANTHROPIC_API_KEY=...
ELEVENLABS_API_KEY=...

# Optional — Session
SESSION_SECRET=your-random-secret-here
```

The API server reads `DATABASE_URL` and `PORT` automatically. The frontend reads no secrets directly.

---

## Database Setup

```bash
# Push schema to your database (creates all tables)
pnpm --filter @workspace/db run push

# Verify tables were created
psql $DATABASE_URL -c "\dt"
```

---

## Running in Development

Open **two terminals**:

**Terminal 1 — API Server (port 5000)**
```bash
pnpm --filter @workspace/api-server run dev
```

**Terminal 2 — Frontend (port auto-assigned)**
```bash
pnpm --filter @workspace/content-engine run dev
```

The frontend proxies API calls to `/api` automatically. Open `http://localhost:PORT` in your browser.

---

## Useful Commands

```bash
# Full typecheck across all packages
pnpm run typecheck

# Regenerate API hooks and Zod schemas from openapi.yaml
pnpm --filter @workspace/api-spec run codegen

# Build the API server
pnpm --filter @workspace/api-server run build

# Push DB schema changes (dev only — never run against production manually)
pnpm --filter @workspace/db run push
```

---

## API Reference

All routes are prefixed with `/api`:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/healthz` | Health check |
| GET/POST | `/api/projects` | List / create projects |
| GET | `/api/projects/stats` | Dashboard statistics |
| GET/PATCH/DELETE | `/api/projects/:id` | Get / update / delete |
| GET/PUT | `/api/projects/:id/configuration` | Get / update config |
| GET/POST | `/api/projects/:id/scenes` | List / generate scenes |
| GET | `/api/plugins` | List all plugins |
| GET | `/api/plugins/categories` | Plugins by category |
| GET | `/api/plugins/:slug` | Get single plugin |
| GET/POST | `/api/bulk-jobs` | List / create bulk jobs |
| POST | `/api/bulk-jobs/:id/cancel` | Cancel a running job |
| GET/POST | `/api/exports` | List / create exports |

The full OpenAPI spec lives at `lib/api-spec/openapi.yaml`. Run `pnpm --filter @workspace/api-spec run codegen` after any change to regenerate typed hooks and Zod schemas.

---

## Phase 2 Roadmap

The architecture is designed to extend — never rewrite. These priorities are next:

1. **AI Orchestrator** — OpenAI / Gemini / Claude provider abstraction. No renderer touches AI directly.
2. **Prompt Templates** — Each plugin owns its own `prompt.ts`. No hardcoded prompts.
3. **Content Pipeline** — Topic → AI content → Plugin scenes → Timeline → Voice → Animation → Export
4. **Theme Marketplace** — Themes as installable packages. Changing theme = zero renderer changes.
5. **Animation Presets** — Reusable preset objects (text anim + transition + camera + particles + timing)
6. **AI Thumbnail Generator** — Auto-generated thumbnail layout, headlines, safe zones, brand colors
7. **Voice Synchronization** — Animation driven by narration length. Timeline adapts to voice.
8. **Plugin Marketplace** — Content types as installable plugins. Zero renderer changes to add one.
9. **Bulk Automation** — CSV / Google Sheets / JSON → Videos + Captions + Titles + Hashtags + Thumbnails
10. **AI Agents** — Script, Design, Voice, SEO, Thumbnail, Publishing, Scheduler, Analytics agents

---

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for full deployment instructions including Replit, Railway, Render, and self-hosted options.

---

## License

MIT
