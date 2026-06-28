# AI Content Engine

A modular, commercial-grade video content generation platform for creators and studios. Produce short-form video content at scale — motivational quotes, business tips, science facts, kids stories — packaged into polished reels for Instagram, TikTok, and YouTube Shorts.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/content-engine run dev` — run the frontend
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19, Vite, Tailwind CSS v4, shadcn/ui, TanStack Query, Wouter
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- `lib/api-client-react/src/generated/` — auto-generated hooks (do NOT edit)
- `lib/api-zod/src/generated/` — auto-generated Zod schemas (do NOT edit)
- `lib/db/src/schema/` — Drizzle table definitions (one file per table)
- `artifacts/api-server/src/routes/` — Express route handlers (one file per resource)
- `artifacts/content-engine/src/pages/` — React page components
- `artifacts/content-engine/src/components/scene-preview.tsx` — animated scene preview renderer

## Architecture decisions

- **Contract-first**: openapi.yaml is edited first, then codegen runs — never the reverse
- **Plugin registry**: content plugins are data objects in `plugins.ts`, not code. New plugins = add to array.
- **No direct AI provider imports in renderer**: orchestrator-only pattern (Phase 2)
- **Scene preview renderer**: CSS animation only — no canvas, no WebGL — renders theme/camera/subtitle variations instantly
- **Modular engines**: voice, animation, camera, music, subtitle, background are all independent config keys

## Product

Users create projects (choosing a content plugin), configure the full engine stack (theme, voice, animation, camera, music, subtitles, background, aspect ratio), generate scenes with the AI orchestrator, preview them live in the animated renderer, and export to Instagram Reels / TikTok / YouTube Shorts. Bulk jobs support CSV/JSON input for batch generation.

## User preferences

- Dark theme, professional, no emojis
- Dense, information-rich UI
- Electric purple (#7c3aed) as primary accent color

## Gotchas

- After editing openapi.yaml: MUST run `pnpm --filter @workspace/api-spec run codegen`
- After adding a lib schema file: MUST run `pnpm run typecheck:libs` before leaf artifact checks
- After adding a DB table: MUST run `pnpm --filter @workspace/db run push`
- Never edit files in `lib/api-client-react/src/generated/` or `lib/api-zod/src/generated/`
- Never use `console.log` in server code — use `req.log` in handlers, `logger` elsewhere
- Google Fonts via `<link>` in `index.html`, NOT CSS @import (causes PostCSS ordering error)

## Phase 2 Roadmap

See `AI-EDITING-GUIDE.md` for the Phase 2 extension map. Key priorities:
1. AI Orchestrator (OpenAI/Gemini/Claude abstraction)
2. Plugin-owned prompt templates
3. Full content pipeline (topic → scenes → timeline → voice → export)
4. Theme Marketplace (themes as installable packages)
5. Animation Presets as data objects
6. AI Thumbnail Generator
7. Voice Synchronization (animation waits for narration)
8. Plugin Marketplace
9. Bulk Automation (CSV/Sheets → videos + captions + hashtags)
10. AI Agents (Script, Design, Voice, SEO, Thumbnail, Publishing)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See `README.md` for full GitHub documentation
- See `AI-EDITING-GUIDE.md` for safe editing rules and Phase 2 extension points
- See `DEPLOYMENT.md` for Replit, Railway, Render, VPS deployment instructions
