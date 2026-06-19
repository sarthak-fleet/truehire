# Plan 0003 — Repo history analyser

**Status:** ready for implementation  
**Created:** 2026-06-12  
**Updated:** 2026-06-13  
**Related PRD sections:** 6 (Signal 1 scoring), 12 (gaming risk), 14 (score decay / last activity mattering, depth vs total)  
**Owner:** (to be assigned)  
**Dependencies:** MVP score validation + feedback that "high volume profiles are hard to interpret" or "easy to game with peripheral work". Pure analyser over enriched ingest data.

---

## Problem

The current public-work score (PRD §6) is deliberately transparent and evidence-based, yet the underlying GitHub signal for any given repo is still coarse:

- "Authored repo with 1.4k stars + 80 commits" looks strong on Recognition + Breadth.
- But the candidate may only have touched docs, a leaf feature flag, or drive-by test fixes in a critical payments or infra module that everyone else owns.

High-volume profiles (many small contributions across many repos) can therefore outscore focused owners of hard, high-impact paths inside fewer repos. This is exactly the gaming risk called out in PRD §12 ("score gaming... Require commits to repos with real issue/PR velocity") and the open question in §14 ("should last activity matter more than total?").

Recruiters and the "what this score is built on" surfaces (already shipping in recruiter takeaway + ScoringDetail) currently have no differentiated language for "peripheral contributor" vs "critical-path owner."

## Proposal

Add a **repo-history analyser** (pure function + supporting ingest enrichment) that, for a sampled set of the candidate's strongest authored + core-contributor repos, derives higher-resolution ownership and effort signals from the shape of changes over time:

- **Critical-path ownership** — % of the candidate's commits that landed in files/directories that are themselves high-churn (frequently touched by many distinct contributors).
- **Effort / impact proxy** — change size weighted by review depth (PR comment volume if available), test delta, or structural centrality (files that appear in many other PRs).
- **Org / repo footprint** — candidate's share of total commits or merged PRs inside that repo (relative to the full contributor graph for the window).
- **Recency-adjusted quality** — the above signals decayed by file "freshness" (when the file was last meaningfully changed) so that 5-year-old ownership of a now-dead module doesn't dominate recent focused work, while still giving career-changers a floor.

The analyser does **not** replace the existing 5-axis score. It produces an explanatory layer (numbers + human-readable bullets) surfaced in:
- The public profile's "what this score is built on" section (enhance ScoringDetail or a new Ownership panel).
- Recruiter evaluate / shortlist / intelligence reports (already using role-fit + evidence).

All output remains **derived from public GitHub data**; no new claims.

## Why this matters now

- Directly mitigates the "volume vs ownership" weakness that will become visible once real high-volume profiles are examined during validation (PROJECT_STATUS planned next item).
- Improves defensibility of Recognition and Breadth axes (PRD §12 risk) without adding ML or new data sources.
- Gives the "recency vs total" question (§14) a practical, per-repo answer instead of a global knob on the depth weight.
- Fits the "costly signal" thesis better than adding Kaggle/arXiv (still orthogonal later).
- The recruiter-proof surfaces (role-fit, evaluations, shortlist) are already live — an ownership panel is a natural, high-leverage addition for them.

## Scope

### In scope
- Sampled analysis of the candidate's top authored + core-contributor repos (reuse existing `isAuthor`, `isCoreContributor`, `weightedScore`, and "meaningful" gate logic from score.ts).
- Ingestion-time enrichment: for the sampled top-N repos, pull additional history metadata (list of commits with file paths for a recent window, or contributor stats + file touch frequency via GitHub APIs that are already being called for craft signals).
- Pure analyser in `packages/core` that, given the enriched per-repo history, emits stable `RepoOwnershipSignal[]` (per repo: criticalPathPct, effortProxy, footprintPct, recencyAdjustedQuality, humanSummaryBullets, etc.).
- Persistence of the analyser output (JSON on the score row or a narrow `repo_ownership_signals` table keyed by (userId, repoFullName, computedAt)).
- UI explanation panel ("what this score is built on — ownership inside key repos") used on public profile, history, recruiter evaluate, and shortlist comparison. Clearly labels everything as "derived estimate from public commit history" with "learn more" link to methodology or a new docs section.
- Low-signal / low-data repos degrade to "insufficient history for ownership analysis" — no false precision.

### Out of scope
- General-purpose repo analytics dashboard or org-admin views (that would be a separate B2B SKU per PRD §11.3).
- Private repos.
- Full per-commit file diff analysis or static analysis (we stay at the level of "which files were touched how often by whom" using GitHub data we can cheaply obtain).
- Code-quality linter, style enforcement, or review-process replacement.
- Using the analyser output to directly change the numeric 0-100 axes in v1 (it is explanatory + future input to scoring only after heavy validation).

### Non-goals
- Not a "trust score for files" or security signal.
- Does not require new OAuth scopes beyond what we already use for public data.

## Detailed implementation shape

1. **Ingest enrichment (apps/web + packages/core/ingest)**  
   During the existing authored-repo + top-external craft pass in `ingestGitHubUser`, for the N highest-weighted repos (e.g. top 8 authored + top 3 core-contrib), additionally fetch:
   - Recent commit list (with file paths) for the repo in the candidate's active window, or use the GraphQL contribution + REST `/repos/{owner}/{repo}/commits` + `/stats/contributors` where helpful.
   - Basic contributor graph snapshot (who touched the repo in last 12-24 months).
   This is the "extend ingest" step. Cost is bounded by sampling + only on the candidate's own top repos. Non-fatal errors (rate limits on a single repo) must not fail the whole ingest.
   Store the raw enriched history alongside `craftJson` — perhaps a new `repoHistoryJson` field on the `contributions` row, or a side structure. Keep it opaque to the scorer; the analyser reads it.

2. **Pure analyser (`packages/core/src/analyser/repo-history.ts` or similar)**  
   New pure module (100% test coverage mandatory).
   ```ts
   export type RepoOwnershipSignal = {
     repoFullName: string;
     criticalPathPct: number;      // 0-100 estimate
     effortProxy: number;          // 0-100
     footprintPct: number;
     recencyAdjustedQuality: number;
     summaryBullets: string[];     // human, evidence-backed
     dataQuality: "high" | "medium" | "low"; // controls UI confidence
   };
   export function analyseRepoHistory(enriched: EnrichedRepoHistory): RepoOwnershipSignal;
   ```
   Heuristics (documented, tunable, tested):
   - File importance = (commit frequency on that file/path across all contributors in window) × (unique contributor count on it).
   - Candidate ownership of critical path = (candidate commits on high-importance files) / (total candidate commits in repo).
   - Effort proxy = (additions + deletions on critical files) × (review comments on the PRs that touched them, if obtainable) normalized.
   - Footprint = candidate merged PRs or commits / total for the repo in the window (capped).
   - Recency = the above decayed by age of the file's last significant change (similar half-life machinery already in score.ts).
   - Minimum activity floor so a single old large PR doesn't create a high "owner" badge on a dead repo.
   All numbers are estimates; the output model carries `dataQuality`.

3. **Persistence**  
   Recommended: new narrow table (or JSON column on `scores` + per-repo on `contributions`).
   - `repo_ownership_signals(user_id, repo_full_name, computed_at, signal_json, data_quality)`
   - Or simply augment the existing `evidenceJson` entries with an optional `ownership` object for the top repos, and store the full analyser output on the score row as `ownershipJson`.
   Start minimal (JSON on scores row for the latest) to avoid migration if possible; add table only if we need historical per-repo ownership snapshots.

4. **Scoring integration (optional, later)**  
   In v1 the analyser is read-only explanation. A future follow-up can feed a small "ownership bonus" into Recognition or a new micro-axis, but only after the signals prove stable across many profiles + we add corresponding tests + methodology updates (per core rules).

5. **UI / explanation panel**
   - Enhance `ScoringDetail` molecule or add `OwnershipBreakdown` (molecule) that renders the top 3-5 repos with the four numbers + 1-2 human bullets + confidence pill ("high / based on 180 commits across 14 files").
   - Used in:
     - `/@handle` page (after evidence rail or inside the expandable "how this score was built").
     - Recruiter `/evaluate` and shortlist cards.
     - Dashboard owner view (more detail + "what would improve ownership signal").
   - Language is careful: "estimated critical-path contribution (derived from public commit + contributor frequency)" — never "you own 87% of the core".

6. **Data quality & graceful degradation**
   - If a repo has < K commits in the window or contributor graph is tiny → "low" quality, surface only as "limited history for ownership analysis".
   - Never surface a high-precision number on a low-data repo.

7. **Analytics**
   - Track views of the ownership panel (`core_action: "ownership_panel_viewed"`) on both public and recruiter surfaces.

## Data model / persistence

- New or extended storage for the per-repo analyser output (see above).
- The raw history data needed by the analyser lives in the ingest enrichment step (new field on `contributions` or a transient structure during the refresh transaction).
- Recompute the analyser output on every score snapshot (cheap once the enriched data exists).
- Public exports (`data.json`, `repos.csv`) can include the ownership signals for the top repos when present (power-user / audit value).

## Acceptance criteria

- For any profile with ≥ 3 sampled repos that have sufficient history, the analyser produces a stable `RepoOwnershipSignal` set for the same underlying GitHub history (deterministic given the enriched input).
- The profile and recruiter surfaces show an "ownership" or "what this score is built on — repo depth" section that lets a recruiter articulate "this candidate has high footprint + critical-path work in the two repos that actually drive the Recognition score" vs "high volume of peripheral changes."
- Every number or bullet is traceable to a documented heuristic + the raw public signals (commit counts, contributor overlap, file touch freq); UI makes the derivation visible ("why this number").
- Low-history repos never produce confident-looking ownership claims (dataQuality low → muted or hidden).
- Core analyser is 100% covered by tests; tests include "drive-by on critical file", "owner of dead module", "recent focused owner of high-churn service", "sparse data" cases.
- No increase in GitHub rate-limit consumption for the average user (sampling + reuse of data we are already fetching for craft / evidence).
- Adding the panel does not change any existing numeric score for existing users.

## Success metrics

- Reduction in recruiter/support questions of the form "how do I know they actually did important work vs just lots of small PRs?" (qualitative + any tagged tickets).
- Higher "trust in score explanation" scores in any post-view feedback (if we add lightweight recruiter feedback).
- Better differentiation in shortlist / compare views between "broad peripheral" and "focused owner" candidates (internal before/after on seeded profiles).
- The analyser output is cited in at least one real recruiter evaluation within 60 days of shipping.

## Risks & mitigations

- Heuristics are noisy / overfit to the repos we happened to test on → Mitigate: heavy test coverage with synthetic + real seeded profile histories, expose the raw inputs in the UI ("based on 47 commits touching 9 files that 23 other people also touched"), make tuning a follow-up with corresponding core test updates.
- Ingest cost / latency / rate-limit spikes on users with many large repos → Mitigate: hard cap on N (e.g. 8-10), only run on authored + core-contrib, make the extra history fetch best-effort and non-fatal, surface "partial ownership data" when some repos failed to enrich.
- Recruiters treat the ownership % as ground truth and over-index on it → Mitigate: very careful copy ("estimate", "public history only", "one signal among several"), always show alongside the raw evidence counts and links, add "this is not a substitute for reading the actual PRs" note.
- False certainty on old or low-velocity repos → Mitigate: dataQuality gate + explicit "insufficient recent activity for reliable ownership analysis" state.

## Sequencing & dependencies

1. MVP score validation + explicit feedback that volume/ownership distinction matters.
2. Core analyser + tests (pure, can be developed against fixture enriched histories).
3. Ingest enrichment path (add the extra REST/GraphQL calls for sampled top repos; store raw history JSON).
4. Persistence (column or small table) + score-service integration (run analyser at compute time).
5. UI panel (molecule + usage in public profile + recruiter evaluate).
6. Documentation updates (methodology footnote or new small section in `docs/signal-1-public-work.md`; mention in recruiter-proof docs).
7. Optional later: feed a small calibrated ownership component into the numeric score (requires new weights + full test updates + methodology change).

Independent of storyteller (plan 0002) and no-signal onboarding (plan 0004). Can run in parallel once the prerequisite validation is done.

## Open questions

- Exact sampling strategy and N (top authored by weightedScore? top by stars? mix with core-contrib?).
- How deep do we go for "file paths" — top-level dir only, or full path hashing with frequency map? (deeper = more signal, more data to store/fetch).
- Whether review depth (PR comments) is reliably available cheaply via the APIs we already call, or whether we approximate with "was reviewed at all" + additions/deletions.
- How prominently to surface the ownership numbers vs keep them as a secondary "explanation only" layer for the first release of the feature.
- Future: should ownership signals eventually influence the main Recognition or a new "Impact" micro-axis? (explicitly deferred in this plan).

## Example (illustrative, for UI and test spec)

For a candidate with strong Recognition from `acme/billing` (authored, 2.3k★):

- criticalPathPct: 68 (most of their commits touched the high-churn `core/ledger` and `payments/retry` modules that 40+ other engineers also touch frequently).
- effortProxy: 74 (larger diff sizes + PRs with 6+ review comments).
- footprintPct: 31 (nearly a third of recent merged PRs in that service window).
- recencyAdjustedQuality: 81 (work is recent; the files are still actively maintained).
- Bullets: "Owned changes in the two hottest files in billing this quarter (by commit count + unique authors). 3 PRs with design discussion."

For a high-breadth candidate with many 1-3 commit "cleanup" PRs across 30 repos: most signals come back low or "low data quality" — the panel says "Broad contributions; limited concentrated ownership signal in any single repo."

---

**Recommendation (from original):** This is the strongest score-depth follow-up once the MVP score is trusted. It improves defensibility without changing the product surface into an ATS or a generic analytics tool.

See `plans/0001` (idea source), `plans/0002` (growth alternative), `plans/0004`.
