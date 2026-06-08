# Project Recommendation Context

Generated: 2026-06-06T21:14:19.641Z

This file is a CodeVetter Repo Unpacked-inspired audit written for Starboard recommendations. It is intentionally local, evidence-oriented, and safe to commit: it records product context, feature areas, stack inventory, and recommendation guidance without secrets or environment values.

## Project Identity

- Slug: `truehire`
- Registry description: AI-powered recruitment and candidate vetting platform.
- Product grouping: `internal-first`
- Source path: `truehire`

## Product Context

AI-powered recruitment and candidate vetting platform.

TrueHire is a verified candidate platform where transparent 0-100 scores are derived from public GitHub signals instead of resume claims. Public profile pages live at /@handle , and recruiter-facing surfaces explain the evidence behind a candidate's score.

The recruiter-facing resume claim audit prototype treats pasted resume text as untrusted candidate-supplied claims, then checks extracted technical claims against verified GitHub evidence. The audit labels claims as verified, partial, or unverified and frames gaps as missing public proof rather than negative skill judgments.

truehire Verified candidate platform — GitHub signals generate a transparent 0-100 score replacing traditional resumes, with public profile pages at /@handle . Scores are derived, never declared : every number on a profile traces back to verified GitHub data. There are no user-editable bios, skills, or titles. Deployment & External Services Concern Service --------- --------- Hosting Cloudflare Workers truehire via @opennextjs/cloudflare — one Worker serves the Next.js frontend and API routes Database Turso libSQL Auth NextAuth v5 + GitHub OAuth CI/CD GitHub Actions — auto-deploy on push to main Stack - Next.js 16 App Router + React 19, TypeScript, Tailwind v4 - Drizzle ORM + Turso libSQL — 

## Feature Map

- **Testing and quality**: Unit tests, browser tests, evals, CI quality gates, and regression checks. Keywords: test, testing, quality, vitest, playwright, ci, eval, benchmark.
- **Cloudflare and deploy**: Workers, Pages, edge runtime, queues, storage, and deploy automation. Keywords: cloudflare, worker, workers, pages, edge, deploy, wrangler, queue.
- **UI workflows**: Dashboards, tables, forms, component systems, charts, and user workflows. Keywords: ui, ux, dashboard, table, component, react, next, tailwind.
- **Database and storage**: SQL, document storage, migrations, cache, queues, vectors, and persistence. Keywords: database, db, sql, sqlite, postgres, turso, libsql, drizzle.
- **Repo intelligence**: Repository understanding, metadata enrichment, code review, and evidence reports. Keywords: review, static, analysis, diff, history, evidence, verification.
- **Auth and identity**: Auth, OAuth, sessions, users, permissions, and account flows. Keywords: auth, oauth, identity, session, user, permission, login, nextauth.
- **AI agents**: Agents, tool use, workflows, orchestration, RAG, evals, and model integration. Keywords: ai, agent, agents, llm, rag, embedding, eval, model.

## Runtime Surfaces and Entrypoints

- `apps/web/src/app/[handle]/page.tsx`
- `apps/web/src/app/about/page.tsx`
- `apps/web/src/app/api/page.tsx`
- `apps/web/src/app/compare/page.tsx`
- `apps/web/src/app/dashboard/page.tsx`
- `apps/web/src/app/demo/page.tsx`
- `apps/web/src/app/humans.txt/route.ts`
- `apps/web/src/app/layout.tsx`
- `apps/web/src/app/login/page.tsx`
- `apps/web/src/app/methodology/page.tsx`
- `apps/web/src/app/page.tsx`
- `apps/web/src/app/privacy/page.tsx`
- `apps/web/src/app/recent/page.tsx`
- `apps/web/src/app/recruiter/resume-audit/demo/page.tsx`
- `apps/web/src/app/stats/page.tsx`
- `apps/web/src/app/suggest/page.tsx`
- `apps/web/src/app/terms/page.tsx`

## Current Stack

- Languages: `Astro`, `TypeScript`
- Frameworks/tools: `Astro`, `Cloudflare Workers`, `Drizzle`, `Next.js`, `OpenNext Cloudflare`, `Playwright`, `React`, `Tailwind CSS`, `Vitest`
- Config files:
- `apps/web/landing-astro/astro.config.mjs`
- `apps/web/next.config.ts`
- `apps/web/playwright.config.ts`
- `apps/web/vitest.config.ts`
- `apps/web/wrangler.jsonc`
- `packages/db/drizzle.config.ts`

## OSS Already In Use

Direct dependencies:
- `@astrojs/sitemap`
- `@auth/core`
- `@auth/drizzle-adapter`
- `@fontsource-variable/inter`
- `@libsql/client`
- `@octokit/graphql`
- `@octokit/rest`
- `@opennextjs/cloudflare`
- `@paralleldrive/cuid2`
- `@saas-maker/feedback`
- `@saas-maker/testimonials`
- `@tailwindcss/vite`
- `@truehire/core`
- `@truehire/db`
- `astro`
- `class-variance-authority`
- `clsx`
- `drizzle-orm`
- `lucide-react`
- `next`
- `next-auth`
- `posthog-js`
- `react`
- `react-dom`
- `tailwind-merge`
- `tailwindcss`

Development dependencies:
- `@cloudflare/workers-types`
- `@playwright/test`
- `@tailwindcss/postcss`
- `@types/node`
- `@types/react`
- `@types/react-dom`
- `beasties`
- `dotenv`
- `drizzle-kit`
- `eslint`
- `eslint-config-next`
- `husky`
- `lightningcss`
- `lint-staged`
- `next`
- `tailwindcss`
- `tsx`
- `typescript`
- `vite`
- `vitest`
- `wrangler`

Package scripts:
- `astro`
- `build`
- `cf:build`
- `cf:deploy`
- `cf:preview`
- `cf:upload`
- `db:generate`
- `db:migrate`
- `db:studio`
- `dev`
- `generate`
- `lint`
- `migrate`
- `prepare`
- `preview`
- `seed:anchors`
- `start`
- `studio`
- `test`
- `test:e2e`
- `test:e2e:local`
- `test:watch`
- `typecheck`
- `validate:env:deploy`

## Testing and Quality Signals

- `apps/web/e2e/mobile.spec.ts`
- `apps/web/e2e/smoke.spec.ts`
- `apps/web/playwright.config.ts`
- `apps/web/vitest.config.ts`
- `packages/core/src/role-fit.test.ts`
- `packages/core/src/scoring/score.test.ts`

## Recommendation Guidance

Good matches:
- Repos that strengthen testing and quality without replacing already-installed libraries.
- Repos that strengthen cloudflare and deploy without replacing already-installed libraries.
- Repos that strengthen ui workflows without replacing already-installed libraries.
- Repos that strengthen database and storage without replacing already-installed libraries.
- Repos that strengthen repo intelligence without replacing already-installed libraries.
- Repos that strengthen auth and identity without replacing already-installed libraries.
- Repos that strengthen ai agents without replacing already-installed libraries.
- Tools with concrete support for src, page.tsx, pnpm, scoring, core, cloudflare, truehire, candidate.
- Implementation repos, SDKs, CLIs, testing utilities, adapters, and focused libraries are higher value than generic awesome lists.

Avoid recommending:
- Do not recommend packages already listed under direct or development dependencies unless the task is migration research.
- Do not recommend broad framework replacements unless the project context explicitly calls for a rewrite.
- Downrank curated lists, archived repos, stale demos, and generic UI kits that do not map to the feature catalog.

## Evidence Read

Primary docs and handoff files:
- `PROJECT_STATUS.md`
- `README.md`
- `agents.md`

Package manifests:
- `apps/web/landing-astro/package.json`
- `apps/web/package.json`
- `package.json`
- `packages/core/package.json`
- `packages/db/package.json`

Inventory notes:
- Files scanned: 188
- This pass uses deterministic repo inventory plus local documentation/source-path evidence. It does not claim a full manual line-by-line review of every source file.

## Confidence

Confidence: **high**

Why:
- PROJECT_STATUS.md present
- README.md present
- 16 entrypoint/runtime files identified
- package dependencies inventoried
- 6 test/quality files identified

Refresh command:

```bash
cd /Users/sarthak/Desktop/fleet/starboard
pnpm fleet:audit-recommendation-context
pnpm fleet:extract-projects
```
