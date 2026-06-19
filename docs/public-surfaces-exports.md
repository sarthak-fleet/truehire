# Public Surfaces & Exports

**Last updated:** 2026-06-13  
**Canonical home for:** All unauthenticated or low-auth public views and machine-readable exports that surface Signal 1 (+ Signal 2 when present).  
**See also:** PRD §6, `docs/signal-1-public-work.md`, agents.md ( `/@handle` guard, derived rule).

---

## Core public profile contract

- Routes: `/@handle` (canonical) and `/handle` (both normalized; `startsWith("@")` guard in the dynamic segment prevents collision with other top-level routes such as `/dashboard`, `/recruiter`, `/about`).
- `generateMetadata` includes score in title and OG/Twitter images point at `/api/og/[handle]`.
- Revalidate 300s (or force-dynamic for history).
- Always derived: load user + latest score + activityMonths + public work history (only confirmed verifs are "Verified").

Key pages under `app/[handle]/`:
- `page.tsx` — hero, breakdown, evidence, languages, timeline, risk flags, work history, recruiter takeaway, scoring detail, copy link.
- `history/page.tsx` — score snapshots (SVG sparkline + table).
- `role-fit/page.tsx` — optional `?jd=` driven report (core `buildRoleFitReport`).
- `embed/page.tsx` — chromeless iframe card (score + 5 axes; noindex).
- `error.tsx`, `loading.tsx`.

## Exports & embeddables (all public, cacheable)

- `/api/og/[handle]` — 1200x630 branded image (score + axes + handle). Used for social share cards and metadata.
- `/[handle]/badge.svg` — small shield/badge (color bands by score ranges); 30s cache.
- `/[handle]/data.json` — full snapshot (user metadata + latest score + activityMonths + public workHistory); appropriate cache headers.
- `/[handle]/repos.csv` — attachment CSV of all contributions (authored + external, with dates, isAuthor/isFork, stars, etc.). "Verifiable activity export" for resumes, disputes, grants, etc.
- Embed page for iframes.

Other discovery / comparison surfaces:
- `/recent` — recently claimed users + scores (newest first).
- `/compare?a=...&b=...` — side-by-side stripped scores (query-driven; consent implied by public profiles).
- `/stats` — fleet aggregates (totals, means, medians, language buckets, etc. via stats-service).
- `/suggest?handle=...` — personalized axis headroom (marginal weighted lift using core caps/weights + hints). Useful for sparse users too.
- `/demo` — full visual mirror of a real profile using hardcoded fixture data (safe for marketing/screenshots).

## Seeded / unclaimed anchors

Profiles can be created (seeded) before the GitHub user has ever signed in. They render publicly (with `seeded` flag) but dashboard/refresh are rejected until the real owner claims via OAuth (`claimed` flag). The sparse/no-signal panel (plan 0004) must handle these gracefully.

## No private or auth-walled core profile data

The profile itself, evidence, score history, and all exports above are public. The only auth-gated surfaces are the owner's dashboard (own scores + work-history management + role-fit generation) and the recruiter tools (which still consume only public profile data + their own pipeline notes/evals).

## Caching & performance notes

- Profile pages: 5 min revalidate.
- Badge/OG/data: shorter or response headers for edge caching.
- Heavy pages (shortlist with many candidates, recruiter evaluate) are dynamic where they join live scores.

## Related code

- `app/[handle]/**/*` and `app/api/og/[handle]/route.tsx`
- `app/recent/page.tsx`, `compare/page.tsx`, `stats/page.tsx`, `suggest/page.tsx`, `demo/page.tsx`
- `lib/score-service.ts` (public getters)
- `app/robots.ts`, `sitemap.ts` (profiles are indexable)
- Badge/CSV/JSON route handlers under `[handle]/.../route.ts`

## Further reading

- agents.md ("`/@handle` route uses a `startsWith("@")` guard")
- `docs/signal-1-public-work.md` (what data powers all of the above)
- Landing page (marketing copy for the public profile value prop)