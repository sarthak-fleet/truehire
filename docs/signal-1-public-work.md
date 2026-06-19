# Signal 1: Public GitHub Work — Requirements & As-Built

**Last updated:** 2026-06-13  
**Canonical home for:** MVP core (PRD §6), current 5-axis scoring, ingest, evidence model, public surfaces built on Signal 1, and growth/exports.  
**See also:** PRD.md (high-level), `/methodology` (live numbers), `PROJECT_STATUS.md`, `plans/0002` (storyteller), `plans/0003` (repo analyser), `plans/0004` (no-signal).

---

## What it is

Signal 1 is the sole source of the 0-100 composite score today: a transparent, log-scaled, recency-weighted measure of sustained public GitHub output (authored repos + meaningful external contributions). Everything on a profile — hero score, axis breakdown, evidence rail, languages, timeline, risk flags, role-fit reports, exports — derives exclusively from this signal plus (when present) a small Signal 2 bonus from verified employment. No user-editable fields.

## Current axes & weights (live source of truth)

Weights, caps, and half-lives are exported from `packages/core/src/scoring/score.ts` and imported directly by the `/methodology` page so docs cannot drift from implementation.

| Axis | Weight | Core idea | Key rules (from code) |
|------|--------|-----------|-----------------------|
| Recognition | 30% | Hardest-to-fake external validation (stars + merged-PR credit on popular repos) | log10(authored stars) + core-contributor share credit on ≥100★ repos; 48-month freshness half-life on pushedAt. |
| Depth | 20% | Sustained activity over time, not bursts | Log-scaled count of months with ≥1 commit, 30-month recency half-life, 48-month cap. |
| Craft | 20% | Quality signals on the work itself | Per-repo CraftSignals (hasCi, hasTests, hasReadme, hasLicense, releases, collaborators, commit-msg stats) aggregated for authored + core repos. |
| Breadth | 15% | Distinct codebases with real engagement | Meaningful repos only (authored + engagement or core-contrib or merged≥2 + commits≥3); LOW_SIGNAL_REPO blocklist (first-contributions, hacktoberfest, leetcode, etc.); log cap at 40. |
| Specialization | 15% | Concentration in one language | Piecewise: 0 below 20% share of weighted activity; linear ramp to 100 at 100% share. Polyglots are rewarded on Breadth instead. |

See `packages/core/src/scoring/score.ts` (W object, freshnessMultiplier, isMeaningful, isCoreContributor, repoCraftScore, etc.) and the methodology page for the exact formulas and "what we deliberately don't measure."

## Ingest & data model (current)

- Dashboard-driven (sign-in only resets `ingestStatus`; real work happens via `/api/refresh` + SSE stream to `/api/refresh/stream`).
- `packages/core/src/ingest/github.ts`: year-by-year GraphQL for contribution calendar + commits/PRs, REST top-up for authored repos + craft signals (contents, releases, contributors, sampled commits).
- Stored per user:
  - `contributions` (one row per repo touched): stars, dates, commit/PR counts, isAuthor (effective, ignoring forks), isFork, primaryLanguage, pushedAt (for freshness), craftJson, weightedScore.
  - `activityMonths` (YYYY-MM buckets) — powers Depth + timeline without storing every commit.
  - `scores` (versioned snapshots): overall, signal1, signal2, the five axes, languagesJson, evidenceJson (top ~10 EvidenceEntry by weight), totals.
- EvidenceEntry (core types): repoFullName, stars, commits, mergedPrs, isAuthor, weight, craftTags, primaryLanguage, etc.
- Recompute on every refresh and on Signal 2 verification changes (light path that re-uses prior signal1).

Rate limit: 5k/hr per OAuth token. Manual refresh is route-level rate-limited (24h cooldown + zombie recovery).

## Key design decisions (enforced)

- **Derived, never declared** (PRD §6.3): no bios, titles, skills. Profile = computation over public GitHub + (optional) cryptographically signed employer confirmations.
- Public by default. `/@handle` (with `startsWith("@")` guard to avoid route collisions) and `/handle` both work.
- No peer ranking / leaderboards in v1.
- Transparent + boring (no ML). Every number must be explainable from the raw data and the formulas in core.

## Public surfaces & exports built on Signal 1

- `/@handle` (and subs): hero (ScoreRing + S1/S2), ScoreBreakdown (with evidence labels), EvidenceRow (top weighted, craftTags), LanguageBar, ActivityTimeline, RiskFlags (client-computed non-judgmental gaps), PublicWorkHistory (Signal 2 overlay), ScoringDetail (expandable per-axis with formulas + improvement levers), recruiter takeaway + dual CTAs.
- `/[handle]/history`: score snapshots + sparkline.
- `/[handle]/role-fit`: `buildRoleFitReport` (core) against optional ?jd=.
- Embed, OG image, badge.svg, data.json (full snapshot), repos.csv (verifiable activity export).
- `/compare`, `/recent`, `/stats`, `/suggest` (headroom), `/demo`.
- Recruiter shortlist / evaluate / resume-audit all consume the same score + evidence + languages.

See `apps/web/src/app/[handle]/...`, `src/lib/score-service.ts`, and the various route.ts files.

## Growth & share loop (current)

Share button + copy link, embeddable badge, OG cards, profile URL in applications. The "every profile has a share button" loop (PRD §11.1) exists; recurring fresh artifacts are the subject of `plans/0002-commit-storyteller.md`.

## Risks & anti-gaming (PRD §12)

- LOW_SIGNAL_REPO blocklist + meaningful gate + core-contributor thresholds + freshness half-lives.
- Future deeper ownership signals (plan 0003) will further separate peripheral volume from critical-path work.

## Open / future (tied to other plans)

- Storyteller for recurring shareable updates (plan 0002).
- Repo-history analyser for ownership/impact inside top repos (plan 0003).
- No-signal / sparse handling so early users aren't shown a hostile blank/low state (plan 0004).

## Related code (primary)

- `packages/core/src/scoring/score.ts` + `types.ts` + `score.test.ts` (100% coverage required for any change)
- `packages/core/src/ingest/github.ts`
- `packages/core/src/role-fit.ts`, `resume-claim-audit.ts` (consume Signal 1 evidence)
- `apps/web/src/lib/score-service.ts`
- `apps/web/src/app/[handle]/page.tsx` and recruiter surfaces
- `apps/web/src/app/methodology/page.tsx` (imports live constants)

## Further reading

- PRD.md (high-level vision + phases)
- `docs/signal-2-employer-verification.md`
- `docs/recruiter-proof-tools.md`
- `docs/public-surfaces-exports.md`
- `PROJECT_STATUS.md`
- `agents.md` (architecture notes, "derived never declared", ingest model)
- GitHub GraphQL/REST docs (for ingest details) — authoritative external source for the raw data model we consume.