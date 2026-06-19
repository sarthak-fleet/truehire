# Plan 0002 — Commit storyteller

**Status:** ready for implementation  
**Created:** 2026-06-12  
**Updated:** 2026-06-13  
**Related PRD sections:** 6 (Signal 1), 11.1 (growth loop), 14 (open questions)  
**Owner:** (to be assigned)  
**Dependencies:** MVP score validation complete (per PROJECT_STATUS.md "Planned Next"); storyteller is read-only over already-ingested data.

---

## Problem

TrueHire already computes a candidate's public-work score and surfaces a static profile + evidence rail, but it gives the owner no low-friction, recurring artifact they can forward or repost that explains "what I shipped lately" in plain language. 

The growth loop (PRD §11.1) currently depends on the candidate manually sharing their profile URL or badge after each refresh. Post-ingest there is no new shareable object that is:
- Obviously derived from the just-refreshed verified data (no invented claims).
- Fresh enough to feel worth posting every week or two.
- Tied directly to the evidence that actually moved the score (repos, PRs, languages, craft signals).

Result: candidates treat the profile as a one-time "set and forget" credential instead of a living, shareable signal source. Recruiters and peers see the same static page repeatedly.

This directly addresses the "recurring share surface" idea originally captured in `plans/0001-signal-extensions.md` and the "how to display progress" angle in PRD §14.

## Proposal

Generate a **profile-attached, weekly storytelling artifact** from the candidate's most recent verified GitHub activity (the same window already ingested for scoring).

The artifact must:
- Produce a short, plain-language summary of notable work (repos + themes + concrete signals that contributed to recent score movement).
- List 3-6 highlighted evidence items (with direct links back to the GitHub objects and to the profile evidence rail).
- Emit two portable forms: (1) copyable text snippet suitable for Twitter/LinkedIn, (2) share-card image (OG-style) anchored to the TrueHire profile.
- Be 100% derived from existing `Contribution` / `EvidenceEntry` / score data — zero user input or free-form narrative.
- Gracefully degrade for low-activity profiles (explicit "steady baseline" or "quiet period" messaging, never fabricates output).

The artifact lives **under the verified profile**, not as a generic feed or standalone newsletter tool. Owner sees it in the dashboard; anyone can view a public shareable version (or the image) when linked.

## Why this matters now

- PROJECT_STATUS "Planned Next" explicitly calls out deciding storyteller vs repo-history analyser once MVP score trust is validated. Storyteller is the pure growth play (distribution without new scoring axes).
- Every refresh already produces fresh evidence. Turning that into a one-click shareable object creates a habit loop ("score updated → new story → post it") that increases third-party profile views without requiring more GitHub calls.
- Reinforces the core thesis: "derived, never declared." The story is marketing copy for real, costly public work — not a new editable field.
- Complements (does not duplicate) the existing `/history` page (score snapshots) and evidence rail.

## Scope

### In scope
- Pure generator (or thin generator over already-loaded data) in `packages/core` that consumes recent contributions/evidence/score snapshot and emits a stable `StorySummary` model.
- Optional lightweight persistence (e.g. `last_story_json` column on the latest `scores` row or a tiny derived table) so the story for the current score is fast to render and stable.
- Owner-only rich view in dashboard (full summary + highlights + copy buttons).
- Public share surface: either extend `/@handle/history` or add a lightweight `/@handle/story` (or query-param driven) that shows the story + the share card.
- Share card image via reuse/extension of the existing OG route pattern (`/api/og/[handle]` or a storyteller-specific variant) — 1200x630, profile-branded, shows 1-2 headline sentences + key repos + TrueHire score.
- Copy-to-clipboard for the text version (plain + maybe markdown).
- Evidence links that point both to GitHub and back into the profile (anchors on the evidence rail or `/history`).
- Graceful empty/low-activity state with honest language and suggestions for what would create a richer story (ties into no-signal thinking in plan 0004).
- One analytics event: `storyteller_shared` (or `core_action` variant) with story id / score version.

### Out of scope
- Generic dev newsletter / digest product (must remain anchored to a TrueHire profile and its verified evidence).
- Automatic posting to Twitter/X, LinkedIn, etc. (explicit opt-in copy only; future OAuth post would be a separate plan).
- Any non-GitHub sources (Kaggle, writing, talks, private work).
- User-editable narrative, titles, or "my story this week" free text.
- Full commit-by-commit prose (we only have rolled-up contribution data + evidence; do not add per-commit storage for this).
- Multi-week history browser of old stories (start with "the story for my current/latest score").
- Email delivery of the digest (out of scope; can be added later once email infra exists for Signal 2).

### Non-goals
- Not a replacement for the profile or evidence rail — a companion shareable slice.
- Does not change scoring weights or add new axes (purely presentation + distribution).

## Detailed implementation shape

1. **Core pure logic (`packages/core`)**  
   Add `src/storyteller/` (or co-located in a new `narrative/` module if we grow more).  
   Export:
   - `type StorySummary { id: string; version: string; headline: string; bullets: string[]; highlights: Array<{repo: string, signal: string, url: string}>; textSnippet: string; generatedAt: string; }`
   - `generateStorySummary(input: { score: ScoreBreakdown; evidence: EvidenceEntry[]; activityMonths: ...; recentContribs?: ...; now?: Date }): StorySummary`
   The generator is **pure** (or receives only already-fetched serializable data). It selects the top-weighted recent evidence entries, groups by repo/theme, produces 2-4 headline sentences using simple templates + repo names + languages + craft signals, never hallucinates numbers. Stable output for the same input (deterministic or seeded).  
   100% unit test coverage required (like score.ts). Include "quiet period", "single-repo burst", and "multi-lang steady" cases.

2. **Persistence (minimal)**  
   Option A (preferred for v1): store the generated JSON on the `scores` row as `storyJson` (or `lastStoryJson`) at score-compute time inside `score-service.ts:refreshUserScore`.  
   Option B: tiny new table `score_stories(userId, computedAt, storyJson)` if we want full history later. Start with column on scores for the "current story".

3. **Service / orchestration**  
   In `apps/web/src/lib/score-service.ts` expose `getLatestStory(userId)` (or derive from latest score).  
   If story is missing on an old score row, generate on-the-fly from the stored evidenceJson/languagesJson (backward compat).

4. **UI surfaces**
   - Dashboard (`apps/web/src/app/dashboard/page.tsx` + new or extended client component): after the score ring + breakdown, show a "This week's story" card (or "Latest story for current score"). Contains headline, 3-5 bullets, "Copy text" button, "Download share card" (or direct link to the image), "View full evidence" anchor.
   - Public: add to `/@handle/history` page (or a new small `story` section) a collapsed or tabbed "Story for latest score" that unauthenticated visitors can see + share. The image URL is stable and cacheable.
   - Reuse/extend OG generation: `apps/web/src/app/api/og/[handle]/route.tsx` or a parallel `/api/og/story/[handle]` that takes the story data (or latest score + regenerates). Keep the same visual language as the profile OG.
   - New small molecule if needed: `StoryCard` or extend existing cards. Keep in the atomic/molecules structure.
   - CopyProfileLink pattern already exists — reuse similar clipboard + toast.

5. **API (thin)**
   - Existing refresh already produces the data. No new heavy endpoints.
   - Optional: `GET /api/story/[handle]` (public, cached) returns the JSON story for embedding or future clients. Simple route that loads latest score + storyJson.

6. **Analytics**
   - Fire `trackCoreAction("storyteller_viewed")` and `"storyteller_shared"` (with handle + score version) from the dashboard and public share surfaces. Use the existing fixed taxonomy in `lib/analytics.ts`.

7. **Migration / rollout**
   - No DB migration if we piggy-back on the scores table (add nullable `story_json` text column via drizzle generate + migrate).
   - Or start fully derived (no column) and only persist after the generator proves stable.
   - Backfill: on first load for a user, generate from their latest score's evidence if missing.

8. **Low-activity & empty handling**
   - If < 3 meaningful recent entries or score delta is tiny: produce "Steady baseline week — X months active, focused on Y. No large new authored repos this window." + link to "how to improve your story" (points at suggest or methodology).
   - Never invent commits or PRs.

## Data model / persistence

- Preferred: add `storyJson: text` (nullable) to the `scores` table (migration 0005). Stores the `StorySummary` for that exact score snapshot.
- The story is immutable per score version (same as the score numbers themselves).
- Public data export routes (`data.json`) should include the latest story when present (nice for power users / future tools).
- No new GitHub API calls — everything comes from the data already written during the ingest + score compute pass.

## Acceptance criteria

- A signed-in owner sees a non-empty story card on dashboard for any score that has ≥ N meaningful recent evidence entries (exact N decided in impl, suggested 3).
- The story text and highlights contain **only** repo names, languages, counts, and qualitative signals already present in the stored EvidenceEntry / Contribution rows for that score. No free text invention.
- Clicking "copy" puts a ready-to-post snippet on the clipboard that includes a link back to the profile.
- The share-card image renders with the same branding as the profile OG and contains the headline + 1-2 key repos.
- Low-activity / new / sparse profiles render an honest empty state panel (no 500, no placeholder fake story, no "0" score invention).
- Story for a given score version is stable across page reloads and time (same input → same or semantically equivalent output).
- Core generator has 100% test coverage; new tests cover quiet, bursty, and multi-repo cases.
- Public visitors can load the story image and text directly from a shareable URL derived from the profile (no auth required for the read path).
- No new GitHub rate-limit exposure; generation is free given already-ingested data.

## Success metrics

- % of dashboard sessions that view or copy the storyteller artifact (target: >25% after 2 weeks of availability).
- Share rate (copies or image loads) per refreshed profile (tracked via analytics + referrers).
- Lift in third-party profile views / unique @handle loads in the 7 days after a storyteller share (compare cohorts).
- Qualitative: candidates mention "I posted my story" in feedback or on social (monitored manually early).

## Risks & mitigations

- Narrative sounds like generic AI marketing copy → Mitigate: strict template + evidence-only sourcing, human review of examples in tests, "derived from your public commits on X, Y" framing in the output.
- Thin stories for real but low-volume contributors feel discouraging → Mitigate: excellent empty/low states + "this is your steady baseline — here's what would create a richer story next month" guidance that links to actual levers (authored repos, merged PRs to starred projects, craft signals).
- Story becomes stale if a user refreshes but the story row isn't updated → Mitigate: generate at score-compute time; on read, if the score's computedAt is newer than any cached story, regenerate on the fly from the evidenceJson.
- Over-attachment to "the story" making candidates optimize for narrative rather than real work → Mitigate: the story is marketing, the score + evidence rail remain the source of truth. Keep the UI hierarchy clear (story is below the score ring and breakdown).

## Sequencing & dependencies

1. MVP score is trusted (validation per PROJECT_STATUS).
2. Implement core generator + tests first (pure, zero UI).
3. Add optional column + persistence in score-service during a refresh.
4. Dashboard surface + clipboard.
5. Public share surface + OG image.
6. Analytics + any export updates.
7. Light docs update in `docs/signal-1-public-work.md` + methodology footer if we want to mention "shareable stories" as a growth affordance.

Can ship behind a simple flag or just to owners first. No interaction with Signal 2 verification flows or recruiter pipelines.

## Open questions

- Exact N for "recent window" (last 30-60 days of activity? last 5-8 evidence entries by weight? both?).
- Should the story be per-score snapshot (immutable history) or always "current best story for my latest score"?
- Tone / length: 2 sentences + bullets vs slightly longer paragraph? User research or A/B on first 20 users.
- Image design: reuse existing OG component or a distinct "story" variant that feels more "update" than "profile"?
- Future extension: multi-week story history browser (low priority; out of v1 of this plan).

## Example mock output (for tests + UI spec)

**Headline:** Shipped auth refresh + observability improvements across two services (May 2026)

**Bullets:**
- Led 47 commits + 3 merged PRs in `acme/platform` (auth layer, now 1.2k★) — strong craft signal (CI + tests + reviewed).
- Core-contributor work on `facebook/react` (12 commits this window) added to Recognition.
- Dominant language this period: TypeScript (68% of weighted activity) — Specialization up.

**Copyable text:**
"Just refreshed my @TrueHire score (82). This month: shipped the big auth refresh in acme/platform and contributed to React core. Evidence: https://truehire.dev/@handle#evidence Full profile: https://truehire.dev/@handle"

(The real generator will use the actual repo names, star counts, and evidence from the user's latest score.)

---

**Recommendation (from original proposal):** This is the best next candidate-side growth feature after score trust is stable. It adds distribution without changing the core scoring model or violating any non-goals.

See also: `plans/0001-signal-extensions.md` (historical source), `plans/0003-repo-history-analyser.md` (the alternative "deeper score" bet), `plans/0004-no-signal-onboarding.md`.
