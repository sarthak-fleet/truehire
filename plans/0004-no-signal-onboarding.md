# Plan 0004 — No-signal onboarding

**Status:** ready for implementation  
**Created:** 2026-06-12  
**Updated:** 2026-06-13  
**Related PRD sections:** 4 (target users — early career), 6.3 (key design decisions — derived not declared), 14 (open questions — "no signal yet"), 16 (alternatives)  
**Owner:** (to be assigned)  
**Dependencies:** Core scoring + profile render live (already true). Can ship independently of storyteller (0002) or repo analyser (0003), but complements both.

---

## Problem

The product is correctly optimized for candidates who already have meaningful public GitHub output (the costly signal that is hard to fake). This creates a sharp, unfriendly edge for:

- Students and bootcamp grads with real private coursework or early side projects that are not yet public or starred.
- Career changers whose strongest recent work is inside a company's private monorepo or non-GitHub systems.
- Strong builders who have been heads-down shipping but have low star counts, few merged PRs to popular repos, or short public history.

Today these users either:
- See a blank / "scoring..." state that never improves (or improves very slowly).
- Get a low numeric score with no explanation of *why* or what would change it.
- Abandon before they understand that the platform is a *credential* built on verifiable public proof, not a résumé editor or coaching service.

PRD §14 explicitly flags this: "How to display 'no signal yet' for students / career-changers without real output? Crucial not to make them feel unwelcome."

Without a dedicated, honest path we risk either (a) leaking trust by papering over the gap or (b) losing legitimate future high-signal users at the exact moment they are motivated to start building the public record.

## Proposal

Add a **no-signal / sparse-signal onboarding experience** that is deliberately honest, non-punitive, and actionable while preserving the invariant that the score (and everything on the public profile) is derived only from verified public GitHub data.

The experience:
- Clearly explains the current state ("not enough verified public work yet" — never "low quality" or "bad engineer").
- Maps the concrete gaps visible in the (low) score data to the specific kinds of public evidence that would move the axes (authored repos with engagement, merged PRs, craft signals, sustained months, language concentration, etc.).
- Gives a "what to do next" panel with the highest-leverage, lowest-friction public actions for *this* candidate.
- On the public `/@handle` view (and in recruiter surfaces) shows a recruiter-friendly explanation: "Absence of public proof is not negative evidence."
- Links forward to the existing `/suggest` surface (already computes marginal headroom per axis) and `/methodology`.
- Once the user accumulates enough signal, the normal score + evidence rail + (future) storyteller surfaces simply appear; the onboarding state disappears with no migration tax.

The main score and profile remain 100% derived. No placeholder numbers, no self-claimed skills, no pseudonymous warm-start.

## Why this matters now

- PROJECT_STATUS and the active AI task log show that recruiter-proof surfaces (risk flags, takeaway, JD eval) are complete. The symmetric candidate-side "why is my profile empty and what do I do?" experience is the natural companion that keeps the product welcoming without weakening the thesis.
- Early seeded anchors and real signups will include exactly the early-career / career-changer population. Handling them well reduces early churn and negative word-of-mouth.
- It directly answers one of the four open questions left in the original PRD §14.
- It is cheap relative to the trust it protects: mostly classification + UI copy + reuse of existing score fields + `/suggest` logic.

## Scope

### In scope
- Detection / classification of "sparse" state using already-computed fields (monthsActive, totalRepos / meaningful repos, signal1/overall, evidence.length, authored star count, craft signals present, etc.). Thresholds live in core (exported constants) so they are testable and documented.
- Dedicated panel / empty state on:
  - Public `/@handle` (when no or very low score).
  - Dashboard (owner view — more actionable, includes "request verification" tie-in if they have work history).
- "What would help most right now" guidance derived from the actual gap vector (e.g. "0 authored repos with ≥5 stars or engagement" → "Ship one small public project or open-source contribution and get a real review / star / merged PR").
- Recruiter-facing variant of the same state (used in shortlist, evaluate, resume-audit when the candidate handle has low signal).
- Links to existing surfaces: `/suggest?handle=...`, `/methodology`, the role-fit form (as a way to see what a JD would value), and (future) storyteller once they have data.
- Careful, consistent language everywhere: "not enough verified public work yet", "absence of proof, not proof of absence", "these are the signals that have the highest leverage for your current profile."
- Analytics: `sparse_profile_viewed`, `sparse_guidance_followed` (click on a suggestion).

### Out of scope
- Any user-editable bio, skills list, "I know React" claims, or free-text narrative.
- Fake, placeholder, or "provisional" scores.
- Pseudonymous or "warm-start" scoring that lets someone claim credit without public evidence.
- General career coaching, résumé review, "build in public" tutorials, or job-search advice beyond the narrow "what public GitHub signals would move *your* TrueHire axes."
- Automatic creation of starter repos or PR templates (that would be a separate tool).
- Changing the core scoring algorithm or weights for sparse users (the numbers stay honest; only the *messaging* changes).

### Non-goals
- Not a "students mode" or separate product surface that forever hides the score.
- The goal is to accelerate the moment when the user *does* have verifiable signal and the normal high-trust profile appears.

## Detailed implementation shape

1. **Detection (packages/core)**  
   Add (or expose) a small pure classifier:
   ```ts
   export type SignalState = "full" | "sparse" | "none";
   export function classifySignalState(score: ScoreBreakdown | null, evidence: EvidenceEntry[]): SignalState;
   ```
   Thresholds (e.g. monthsActive < 6 && meaningfulRepos < 2 && signal1 < 25 && evidence.length < 3) live as exported `SPARSE_THRESHOLDS` constants so `methodology` and tests can reference them and they can be tuned with test updates.
   "Sparse" vs "none" can be two levels if useful for copy.

2. **Profile & dashboard rendering**  
   In `apps/web/src/app/[handle]/page.tsx` (public) and dashboard:
   - After loading score + evidence + months, call the classifier.
   - If not "full", render a dedicated `SparseSignalPanel` (new molecule or organism) instead of (or above) the normal ScoreRing + breakdown + evidence rail.
   - The panel contains:
     - Honest headline + 1-2 sentence explanation.
     - Gap summary (derived from the actual low numbers: "No authored repos with engagement yet", "Short activity window (3 months)", "Evidence is mostly external single-commit PRs").
     - "Highest-leverage next steps for you" — 2-4 concrete, evidence-mapped suggestions. Reuse or call the same headroom logic that powers `/suggest`.
     - "What this looks like for recruiters" blurb (the recruiter view can be a collapsed or variant rendering of the same panel).
   - When signal improves on next refresh, the normal profile content simply appears (no special "graduation" UI needed beyond perhaps a one-time celebratory note).

3. **Recruiter surfaces**  
   In shortlist, evaluate, resume-audit, and any place that shows a candidate card or intelligence report: if the candidate is sparse, show the recruiter explanation ("This profile has limited verified public GitHub activity. Absence of proof is not negative evidence about skill.") + the same gap bullets (so a recruiter using the resume-audit demo or JD paste can see "the resume claims X but there is also almost no public record yet").
   Do **not** hide the candidate or pretend the score is something else.

4. **Suggestions & forward paths**  
   The existing `/suggest` page is already designed for headroom. Wire the sparse panel suggestions to deep-link into it (or embed a lightweight version).
   Link "See how a real JD would evaluate public work like yours" to the role-fit form (even with an empty or example JD) — this gives the user a concrete picture of what evidence would be valued.
   Once storyteller (0002) or analyser (0003) exist, the sparse panel can mention them aspirationally: "Once you have a few authored repos with reviews, you'll also get a weekly shareable story."

5. **Language & copy system**  
   Centralize the strings (or a small `sparseCopy.ts` map) so public vs recruiter vs owner tone variants stay consistent. Owner tone is encouraging + specific; recruiter tone is neutral + "proof vs absence" framing; public sparse profile uses the recruiter tone.

6. **Seeded / unclaimed anchors**  
   Many seeded profiles may be sparse by design. The same panel must render for them (they are public but not yet claimed). This is good — it demonstrates the honest state even for "good" engineers who simply haven't published much yet.

## Data model / persistence

- None required beyond what already exists. The classifier runs on the fly from `scores` + `evidenceJson` + `activityMonths` + `contributions` rollups.
- If we later want to A/B copy or record "which gap explanation a user saw", we can add a tiny event or a `last_sparse_classification` on the user row — out of scope for v1.

## Acceptance criteria

- Any profile whose latest score + evidence falls below the (documented, tested) sparse thresholds renders a dedicated, clearly worded panel on both the public `/@handle` and the owner dashboard instead of a confusing low score with no context.
- The panel language never uses judgmental terms ("low quality", "weak", "bad") and always frames in terms of "verified public work" and "evidence".
- The "what would help" items are specific to the actual gaps in *this profile's* data (different users see different top suggestions).
- Recruiter-facing views (shortlist, evaluate, resume-audit when a sparse handle is involved) surface an explanation that "no public signal" ≠ "negative signal" and do not display a misleading numeric score as authoritative.
- Sparse candidates still have one-click paths to the existing `/suggest`, role-fit, and methodology surfaces.
- Once a previously sparse user crosses the threshold on a refresh, the normal score + evidence + timeline content appears on next load with no extra state to clear.
- Core classifier + thresholds have 100% test coverage; tests cover the boundary cases and the "becomes non-sparse on next score" transition.
- No user can enter claims, bios, or skills through this flow (the rest of the app already prevents it; this plan adds no new input surfaces).

## Success metrics

- Lower bounce / higher time-on-page for low-signal public profiles (instrument via analytics or simple server timing).
- Higher % of users who were initially classified sparse and who later receive a "full" score within N days/weeks (activation of the improvement loop).
- Measurable drop in support / feedback questions of the form "why is my profile empty / 12 / scoring forever?"
- Qualitative: early-career or career-changer users report (in feedback or social) that the honest guidance felt fair and gave them a concrete thing to do.

## Risks & mitigations

- Guidance is too generic ("contribute to open source") and feels like career-advice spam → Mitigate: make every suggestion traceable to a real gap in the user's actual evidence/score vector ("you have 0 authored repos with engagement — here are the smallest public things that produced a star or merged PR for similar profiles").
- Language is accidentally sharp or demoralizing → Mitigate: explicit review of all strings by product owner + seeded test profiles; A/B the copy in the first cohort; owner tone is warmer than the public/recruiter tone.
- The feature becomes a vector for résumé-builder drift (users start asking for "add a note that I know X even though it's private") → Mitigate: hard scope limit in the plan + code review + docs; any new input field would be a separate (and rejected) change. The panel only ever points at *public verifiable actions*.
- Sparse state is shown for legitimately strong engineers who simply work in private-heavy environments → Mitigate: the copy explicitly calls this out ("many excellent engineers have most of their impact inside private repos or non-GitHub systems; this platform only shows the public part today").

## Sequencing & dependencies

1. Core classifier + constants + tests (pure, can be done against fixture scores).
2. Public profile sparse panel (molecule + conditional render in `[handle]/page.tsx`).
3. Dashboard owner view (more actionable CTAs + link to work-history verify as one possible "public proof" path if they have employment to corroborate).
4. Recruiter surface updates (shortlist, evaluate, resume-audit demo) to handle sparse candidates gracefully.
5. Wire-up to `/suggest` and role-fit for the "see what would be valued" links.
6. Copy / language finalization + analytics events.
7. Light updates to `docs/signal-1-public-work.md` and any methodology "what we don't measure" section.

Can ship early (even before full validation of high-signal scores) because it improves the experience for the exact population that would otherwise be most frustrated. Independent of the growth (storyteller) and depth (analyser) plans.

## Open questions

- Exact numeric thresholds for "sparse" vs "none" vs "full" (start conservative; expose as constants so they are easy to adjust with tests).
- How many suggestions to show (2 vs 4) and whether to order by "easiest to achieve" or "highest marginal score lift".
- Whether to add a one-time "welcome, here's how TrueHire works for people early in their public record" email or in-app coachmark for newly signed-up sparse users (nice-to-have; email infra not yet present).
- Long-term: should very strong private-work candidates ever have a *separate* verified path (employer verification of private impact, or paid audition) that gives them a non-zero starting point? (This would be a Phase 2+ extension, not part of this plan.)

## Example copy (owner dashboard, sparse state)

**Headline:** Not enough verified public work yet

Your current TrueHire score is based only on public GitHub activity we can independently check. Right now we see:
- 2 months with activity
- 1 repo with commits, but no stars or merged PRs from others
- No clear craft signals (tests, CI, reviews) on the repos you've touched

This is common for early-career engineers and people whose best work has been inside private codebases. It is absence of public proof, not a judgment on your skill.

**Highest-leverage things that would move your profile right now:**
1. Ship one small public project (or extract a useful library/tool from private work) and get at least one real star or external contributor.
2. Make 2–3 meaningful merged PRs (with review discussion) to a repo that already has ≥ 50–100 stars and some issue activity.
3. Add tests + CI to one of your existing public repos (this directly feeds the Craft axis).

See personalized suggestions → [link to /suggest]

You can also add work history and request employer verification (that adds a small Signal 2 bonus once confirmed).

**For recruiters visiting this page:** This candidate has limited public GitHub history so far. Many strong engineers are in exactly this position early on or when most impact is private. The profile will update automatically as verifiable public work appears. No claims are accepted on the platform — only what GitHub shows.

---

**Recommendation (from original proposal):** This is the best trust-preserving companion feature for the MVP. It does not weaken the core model, and it makes the product less hostile to users who are not yet well represented on GitHub.

See also `plans/0002` and `0003` for the growth and depth extensions that become relevant once a user crosses the sparse threshold.
