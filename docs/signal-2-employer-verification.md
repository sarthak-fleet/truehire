# Signal 2: Employer Verification — Requirements & As-Built

**Last updated:** 2026-06-13  
**Canonical home for:** PRD §7 (Phase 2), current schema + crypto design, compute, UI flows, beta status, and remaining wiring.  
**See also:** PRD.md §7-8, `docs/signal-1-public-work.md`, `PROJECT_STATUS.md` (Signal 2 listed under scaffold), verify-service.ts, work-history UI.

---

## What it is

Signal 2 is a small, independent bonus (0-100, applied at most +15 to overall) derived from cryptographically signed confirmations of work history by employers (or managers/peers). It is **additive** to the GitHub Signal 1 composite. Unverified or pending entries contribute zero and are shown with appropriate status chips. The platform never arbitrates disputes.

It is the first "third-party signed credential" costly signal from the original hypothesis table (PRD §2).

## Current implementation status

- **DB (migration 0001):** `work_history` (per-user company/title/YYYY-MM dates + optional domain) + `employer_verifications` (id, workHistoryId, status enum pending/confirmed/denied/disputed/expired, verifierEmail/domain, method enum, tokenHash, signature, timestamps, notes).
- **Crypto (verify-service.ts):** `createVerificationRequest` generates CUID id + random 32-byte token, stores HMAC-SHA256(`id:token`) using `AUTH_SECRET`, returns the raw link `/verify/{id}.{rawToken}` (14-day TTL). `readVerificationByToken` does timing-safe compare + auto-expires. `respondToVerification` records the decision + new HMAC signature over `(id|decision|timestamp)` and updates status/respondedAt/notes.
- **Scoring:** `computeSignal2` (25 base per confirmed role + 4 pts per year of tenure, capped at 5y → max 100 for that signal). `signal2OverallBonus(signal2) = round(signal2 * 0.15)` capped at +15 on overall. `recomputeSignal2OnVerificationChange` inserts a new score snapshot reusing the prior signal1 (no re-ingest).
- **UI:**
  - Dashboard: `work-history.tsx` (add form with validation, "Request HR verification" → shows the manual link to forward; status chips; beta badge; "Email delivery isn’t wired yet").
  - Public `/@handle`: `WorkHistoryPublic` — only confirmed show "Verified" + signer domain; others self-claimed / pending / denied / disputed (zero contribution).
  - `/verify/[token]`: public landing + decision form (confirm/deny/dispute + notes).
  - Recruiter surfaces and role-fit reports can surface verified tenure.
- **API:** `/api/work-history` (list/add), `/api/work-history/[id]/verify` (create request), `/api/verify/respond` (decision → recompute).
- **Not yet wired:** Real transactional email (Resend/Cloudflare Email/etc.). The stub just returns the link for manual copy/forward. No payroll (Plaid/Argyle/Rippling) paths implemented yet even though the method enum has slots.

## Trust hierarchy (as realized)

Matches PRD §7.3 with the current method enum:

- Automated (future via payroll integration) — highest
- Semi-automated (email_hr or email_manager) — high
- Peer (former manager/colleague) — medium
- Unverified self-claim — shown greyed, zero bonus

Edge cases from PRD §7.2 are handled in the data model and UI (pending, nudge via re-request, dispute surfaced publicly, small company = manager email works, dead company = still recorded as self-claim with no verification possible).

## Data model details (schema.ts + migrations)

- `workHistory.userId` → users (cascade).
- `employerVerifications.workHistoryId` → workHistory (cascade).
- `latestVerificationForWorkHistory` returns the most recent request per work-history row, preferring more-resolved statuses on ties.
- Signal 2 is recomputed from the set of workHistory rows that have at least one confirmed verification.

## Design constraints (enforced)

- Everything that contributes to the bonus must be cryptographically signed with the app secret at response time. Rotating `AUTH_SECRET` invalidates old signatures (acceptable for current launch stage).
- No user can self-promote an entry to "verified".
- Public profile and data exports only ever show the verified status when a valid signature exists.
- "We do not arbitrate" (PRD §7.2, §8.4) — disputed entries stay visible with that label.

## Remaining work (from code comments + PRD)

- Wire real email delivery (Resend or equivalent) so the candidate doesn't have to manually forward the link.
- Add payroll / automated method (Plaid/Argyle/Rippling/Workday) as higher-trust options.
- Nudge UI / expiry jobs for pending requests.
- Possibly surface a public "dispute history" feed (currently just the per-entry status).
- Production secrets for email + any payroll providers (never in vars; wrangler secret put).

See verify-service.ts header comment: "Not wired to a real email sender yet. Stub returns the link for manual copy during bootstrap; swap in Resend/Cloudflare Email when ready."

## How it blends with Signal 1

- Score row stores both `signal1` (pure GitHub) and `signal2`.
- Overall = min(100, signal1 + signal2OverallBonus(signal2)).
- Public UIs show "S1: 78 · S2: 42 (+6)" style breakdowns where relevant.
- Risk flags, role-fit, and recruiter intelligence already have hooks for Signal 2 presence.

## Related code (primary)

- `packages/db/src/schema.ts` (workHistory, employerVerifications)
- `apps/web/src/lib/verify-service.ts` (full crypto + computeSignal2 + tenure math)
- `apps/web/src/lib/score-service.ts` (getPublicWorkHistory, recomputeSignal2OnVerificationChange, integration in refresh)
- `apps/web/src/app/dashboard/work-history.tsx`
- `apps/web/src/app/[handle]/page.tsx` (uses PublicWorkHistory)
- `apps/web/src/app/verify/[token]/page.tsx` + decision-form
- API routes under `api/work-history*` and `api/verify/respond`
- Migrations 0001 (tables + claimed/seeded on users)

## Further reading

- PRD.md §7 (original Phase 2 spec) and the archived v0.1 for the full early flow.
- `docs/recruiter-proof-tools.md` (how verified work history appears in evaluations).
- `docs/signal-1-public-work.md` (the dominant signal).
- Methodology page (bonus section on Signal 2).
- Fleet AGENTS.md (keep docs in sync with schema + services).