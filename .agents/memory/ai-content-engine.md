---
name: AI Content Engine Architecture
description: Key decisions and gotchas for the AI Content Engine project — what to touch, what not to, and how the layers connect.
---

## Contract-First Rule
openapi.yaml (`lib/api-spec/openapi.yaml`) is always edited FIRST. After any change: `pnpm --filter @workspace/api-spec run codegen`. Never edit `lib/api-client-react/src/generated/` or `lib/api-zod/src/generated/` by hand — both are overwritten on every codegen run.

**Why:** Frontend hooks and backend Zod validators are derived from one source of truth. Manual edits cause divergence.

**How to apply:** Any new endpoint = 1) add to openapi.yaml, 2) run codegen, 3) write backend route, 4) use generated hook in frontend.

## Lib rebuild after schema changes
After adding a new file to `lib/db/src/schema/` and re-exporting from `index.ts`, must run `pnpm run typecheck:libs` before the API server typecheck passes.

**Why:** The api-server imports `@workspace/db` compiled declarations. Stale declarations cause "no exported member" errors even though the source is correct.

## Plugin registry pattern
Content plugins are data objects in `artifacts/api-server/src/routes/plugins.ts` (PLUGINS array). Scene content banks live in `artifacts/api-server/src/routes/scenes.ts` (getContentBank function). Adding a plugin = add to array, no other files.

## Scene preview renderer
`artifacts/content-engine/src/components/scene-preview.tsx` — CSS animation only (no canvas/WebGL). Renders theme palette, background type, camera movement, subtitle mode, and CTA. Embedded in project detail page: large preview in left panel + mini thumbnail in each storyboard card.

## Google Fonts
Load via `<link>` tags in `artifacts/content-engine/index.html`, NOT via CSS @import in index.css. CSS @import after tailwindcss directives causes PostCSS ordering error at build time.

## Phase 2 extension points
- AI Orchestrator → `artifacts/api-server/src/services/ai-orchestrator.ts`
- Prompt templates → `artifacts/api-server/src/plugins/*/prompt.ts`
- Theme marketplace → new DB table + route
- Animation presets → new DB table + route
- AI Agents → `artifacts/api-server/src/agents/interfaces/`
All Phase 2 features must define an interface before any concrete AI provider is used.
