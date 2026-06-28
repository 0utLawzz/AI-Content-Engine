# AI Editing Guide — AI Content Engine

> Read this before making any changes. This document exists because this codebase has a deliberate architecture. Editing the wrong layer breaks the other layers.

---

## The Golden Rule

**Never rewrite. Always extend.**

This project is a permanent core. New features are added as plugins, routes, or services. Existing modules are never replaced — only augmented.

---

## Contract-First Development

The **only source of truth** for the API is `lib/api-spec/openapi.yaml`.

Every time you change the API:
1. Edit `lib/api-spec/openapi.yaml`
2. Run `pnpm --filter @workspace/api-spec run codegen`
3. The frontend hooks in `lib/api-client-react/` and Zod schemas in `lib/api-zod/` are auto-generated

**Never** edit files inside `lib/api-client-react/src/generated/` or `lib/api-zod/src/generated/` by hand. They will be overwritten.

---

## What You Can Safely Edit

### Backend — add features here

| File / Directory | What to do |
|-----------------|-----------|
| `artifacts/api-server/src/routes/` | Add new route files here. One file per resource. |
| `artifacts/api-server/src/routes/index.ts` | Register new routers here after creating them |
| `lib/db/src/schema/` | Add new table files here. One file per table. |
| `lib/db/src/schema/index.ts` | Re-export new table files here |
| `lib/api-spec/openapi.yaml` | Add new endpoints or schemas. Run codegen after. |

After adding a new DB table: run `pnpm --filter @workspace/db run push`
After changing the OpenAPI spec: run `pnpm --filter @workspace/api-spec run codegen`
After adding a lib package export: run `pnpm run typecheck:libs`

### Frontend — add features here

| File / Directory | What to do |
|-----------------|-----------|
| `artifacts/content-engine/src/pages/` | Add new page components here |
| `artifacts/content-engine/src/components/` | Add new reusable components here |
| `artifacts/content-engine/src/App.tsx` | Register new routes here |
| `artifacts/content-engine/src/components/layout.tsx` | Add new nav items here |

### Content Plugins — extend the plugin registry

| File | What to do |
|------|-----------|
| `artifacts/api-server/src/routes/plugins.ts` | Add new plugin objects to the `PLUGINS` array |
| `artifacts/api-server/src/routes/scenes.ts` | Add new content banks in `getContentBank()` |

---

## What You Must Never Touch

| File / Directory | Why |
|-----------------|-----|
| `lib/api-client-react/src/generated/` | Auto-generated. Overwritten by codegen. |
| `lib/api-zod/src/generated/` | Auto-generated. Overwritten by codegen. |
| `artifacts/content-engine/src/components/ui/` | shadcn/ui primitives. Editing breaks design consistency. |
| `pnpm-workspace.yaml` catalog section | Changing catalog versions breaks dependency resolution. |
| `tsconfig.base.json` | Shared TS config for all packages. Changes affect the entire monorepo. |
| `tsconfig.json` (root) | Solution file for lib composite builds. Only add lib references here. |
| `.replit-artifact/artifact.toml` files | Artifact routing configuration. Do not edit port or path mappings. |
| `lib/db/drizzle.config.ts` | Drizzle config. Changing output paths breaks migrations. |

---

## How the Monorepo Is Wired

```
openapi.yaml
    ↓ (codegen)
lib/api-client-react   ← frontend imports hooks from here
lib/api-zod            ← backend imports Zod schemas from here
    ↑
lib/api-spec (codegen runs orval)

lib/db                 ← backend imports db client and tables from here
    ↑
lib/db/src/schema/     ← you add tables here

artifacts/api-server   ← Express app, imports from lib/db and lib/api-zod
artifacts/content-engine ← React app, imports from lib/api-client-react
```

Frontend hooks **never** call the API directly with fetch. They always use the generated hooks from `@workspace/api-client-react`.

---

## Adding a New Route (Step by Step)

1. Add the endpoint to `lib/api-spec/openapi.yaml`
2. Run `pnpm --filter @workspace/api-spec run codegen`
3. Create `artifacts/api-server/src/routes/my-resource.ts`
4. Import and register the router in `artifacts/api-server/src/routes/index.ts`
5. In the frontend, use the generated hook: `import { useMyNewHook } from "@workspace/api-client-react"`

---

## Adding a New DB Table (Step by Step)

1. Create `lib/db/src/schema/my-table.ts` with the Drizzle table definition
2. Export it from `lib/db/src/schema/index.ts`
3. Run `pnpm run typecheck:libs` (rebuilds lib declarations)
4. Run `pnpm --filter @workspace/db run push` (creates the table)

---

## Adding a New Content Plugin (Step by Step)

1. Add the plugin object to the `PLUGINS` array in `artifacts/api-server/src/routes/plugins.ts`
2. Add a content bank entry in `getContentBank()` in `artifacts/api-server/src/routes/scenes.ts`
3. That's it. No other files need changing.

---

## Adding a New Frontend Page (Step by Step)

1. Create `artifacts/content-engine/src/pages/my-page.tsx`
2. Import it in `artifacts/content-engine/src/App.tsx`
3. Add `<Route path="/my-page" component={MyPage} />` to the `<Switch>`
4. Add a nav item in `artifacts/content-engine/src/components/layout.tsx`

---

## TypeScript Rules

- Run `pnpm run typecheck` to verify the full workspace. Trust this over your editor.
- If editor shows errors but CLI passes, the editor is stale. Trust the CLI.
- Never use `any` to silence a type error. Fix the type.
- Imports from `@workspace/api-client-react` must use the package name — never relative paths to the `lib/` folder.
- Only import what you use. Unused imports break the build.

---

## Phase 2 Extension Points

When building Phase 2 features, attach them here:

| Phase 2 Feature | Where to Add It |
|----------------|----------------|
| AI Orchestrator | New file: `artifacts/api-server/src/services/ai-orchestrator.ts` |
| Prompt Templates | New files: `artifacts/api-server/src/plugins/*/prompt.ts` |
| Content Pipeline | New route: `artifacts/api-server/src/routes/pipeline.ts` + OpenAPI endpoint |
| Theme Marketplace | New table: `lib/db/src/schema/themes.ts` + new route + plugin registry |
| Animation Presets | New table: `lib/db/src/schema/animation-presets.ts` + registry |
| AI Thumbnail Gen | New service: `artifacts/api-server/src/services/thumbnail-generator.ts` |
| Voice Sync | Extend `artifacts/api-server/src/routes/scenes.ts` with duration calculation |
| Bulk Automation | Extend `artifacts/api-server/src/routes/bulk_jobs.ts` |
| AI Agents | New interface files: `artifacts/api-server/src/agents/interfaces/` |

**Rule:** Every Phase 2 feature must define an interface first. Nothing depends on a concrete AI provider — only on the interface.

---

## Logging

Never use `console.log` in server code. Use:
- `req.log` inside route handlers
- `logger` (imported from `./lib/logger`) for non-request code

---

## Running Validation Before Submitting Changes

```bash
pnpm run typecheck          # Full workspace typecheck
pnpm --filter @workspace/api-server run build   # Build the API server
```

If either fails, do not submit the changes.
