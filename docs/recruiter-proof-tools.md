# Recruiter-Proof Tools — Role-Fit, Resume Audit, Pipelines & Shortlist

**Last updated:** 2026-06-13  
**Canonical home for:** The post-MVP recruiter surfaces (role-fit reports, resume-claim-audit prototype, hiring roles/pipelines/evaluations, shortlist comparison). These are "proof" and evaluation aids, not an ATS replacement.  
**See also:** PRD §5/6.2 (non-goals: no recruiter-side ATS), PROJECT_STATUS.md ("recruiter proof improvements"), `docs/signal-1-public-work.md`, `docs/signal-2-employer-verification.md`.

---

## Purpose & philosophy

These tools let recruiters and hiring teams **evaluate TrueHire profiles against a role description or pasted resume using only verified public signals + (when present) signed employment**. 

They treat candidate-supplied text (resume, LinkedIn claims, free-text) as **untrusted input** that must be audited against the derived GitHub evidence and Signal 2. Gaps are framed as "missing public proof," never as "lacks the skill."

This matches the core thesis (costly signals) and the explicit non-goal: "Recruiter-side ATS replacement (we're a credential provider, not a pipeline tool)."

The surfaces were built as "recruiter proof" — concrete, evidence-backed explanation layers — before any broader hiring workflow features (per PROJECT_STATUS guidance).

## Core pure functions (packages/core)

### role-fit.ts
- `RoleRequirement` = { id, label, category: language|framework|practice|domain, weight, keywords[] }
- `extractRoleRequirements(text)` — keyword catalog match + extra free keywords from the input text. Produces weighted requirements.
- `buildRoleFitReport({ jobDescription, score, evidence })` — for each requirement, finds matching EvidenceEntry items (by language share + repo signals + matchedSignals), computes per-req score, strengths, gap, remediation text.
- Returns `fitScore`, `verifiedStrengths`, `gaps`, summary.
- Also exports `buildShortlistComparisonReport`, `buildRecruiterCandidateIntelligenceReport` (strengths/risks/follow-up questions/evidence links).

Used everywhere: public `/[handle]/role-fit`, dashboard role-fit form, shortlist, recruiter evaluate (rubric auto-populated from role.requirementsJson), resume-audit.

### resume-claim-audit.ts
- `buildResumeClaimAuditReport({ resumeText, score, evidence })`
- Re-uses role-fit on the resume text itself.
- Derives `verified` / `partial` / `unverified` per claim (≥65 + evidence = verified; ≥25 or evidence = partial).
- Produces findings with reason + followUpQuestion, coverageScore, evidenceLinks, and **hardcoded fairness caveats**:
  - "Resume text is treated as candidate-supplied claims, not proof."
  - "Unverified means public GitHub evidence did not support the claim; it does not prove the candidate lacks the skill."
  - "Do not use absent public work as a proxy for protected attributes, employment constraints, private-repo work, or non-GitHub ecosystems."

Fixture-backed demo at `/recruiter/resume-audit/demo` (uses `shortlist/demo/fixtures.ts`).

## Hiring domain (schema + service)

Tables (migration 0004):
- `hiringRoles` (name, description, requirementsJson) — created via `extractRoleRequirements` on the JD text.
- `hiringPipelines` (roleId, name, status active/closed/archived)
- `pipelineCandidates` (pipelineId, userId, stage enum shortlist→hired/rejected, notes)
- `candidateEvaluations` (pipelineCandidateId, stage, scoresJson (reqId → {score, feedback}), overallRecommendation enum, evaluatorId)

`hiring-service.ts` provides the CRUD + joins.

UI:
- `/recruiter/roles/*` — list + new (auto-extracts requirements) + detail (rubric cards).
- `/recruiter/pipelines/*` — list + new + `[id]` kanban-style stage columns; add candidate by `@handle`; per-candidate "Evaluate" link.
- Evaluate page: pins live TrueHire score + evidence + languages + Signal 2 indicator; rubric (radios + feedback per extracted req, auto-matched to repos); "Candidate intelligence" report (core); status history; overall rec + next-action (stay/advance/reject); past evaluations.

Shortlist (`/recruiter/shortlist` + demo):
- Paste JD + list of handles → `buildShortlistComparisonReport` → ranked table + per-candidate mini cards (fitScore, topStrengths, topGaps, mini stats).
- `JdEvaluator` molecule in empty state (client-side keyword preview of which of the 5 axes a JD text would reward — no data required).
- Export report button (print-oriented).

All surfaces are server-action + revalidate heavy; read paths use score-service + hiring-service.

## Evidence labels, risk flags, takeaway (supporting proof)

These were added in the "recruiter proof" wave (see README active-AI-task-log):
- ScoreBreakdown rows show inline evidence source (public GitHub / portfolio / activity / consistency).
- `RiskFlags` (client-computed from score/evidence/months): no recent activity, sparse craft, short window, no authored repos, single-language, low traction. Non-judgmental; each links to GitHub evidence. Hidden when none apply.
- Recruiter takeaway card after evidence rail: track record / community signal / craft stats + "no ML" trust note + dual CTAs (primary "Contact {handle} on GitHub", secondary "Review evidence first" anchoring to `#top-evidence`).

## Scope boundaries (what these tools are not)

- Not candidate sourcing or JD posting (we do not push roles; candidates come via credential quality).
- No full pipeline automation, interview scheduling, offer management, or outcome tracking (those are later phases).
- No user-editable profile fields that would let a candidate "game" the recruiter view.
- Resume-audit and shortlist demos are explicitly prototype/fixture-backed today.

## Analytics

Fixed taxonomy events (analytics.ts): `role_fit_run`, work on recruiter surfaces, etc. Core actions are tracked on key interactions.

## Related code (primary)

- `packages/core/src/role-fit.ts` + `role-fit.test.ts`
- `packages/core/src/resume-claim-audit.ts` + `resume-claim-audit.test.ts`
- `apps/web/src/lib/hiring-service.ts`
- `apps/web/src/app/recruiter/**/*` (roles, pipelines/[id]/evaluate, shortlist, resume-audit/demo + fixtures)
- `apps/web/src/components/molecules/jd-evaluator.tsx`
- `apps/web/src/app/[handle]/role-fit/*`
- `apps/web/src/app/dashboard/role-fit-form.tsx`
- Shortlist export and pipeline candidate add flows.

## Further reading

- PRD non-goals §5 and "recruiter-side tools out of scope for MVP" §6.2.
- `docs/signal-1-public-work.md` and `docs/signal-2-employer-verification.md` (the inputs these tools consume).
- Methodology (the axes that JdEvaluator previews).
- `PROJECT_STATUS.md` ("keep recruiter proof concrete before adding broader hiring workflow features").
- `plans/` (future extensions are candidate-side or deeper Signal 1; recruiter tools stay in the proof/evaluation layer for now).