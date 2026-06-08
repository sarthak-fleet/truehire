# Project Status

Last updated: 2026-06-08

## Current Scope

TrueHire is a verified candidate platform where transparent 0-100 scores are derived from public GitHub signals instead of resume claims. Public profile pages live at `/@handle`, and recruiter-facing surfaces explain the evidence behind a candidate's score.

## Done

- The MVP is centered on Signal 1: public GitHub work.
- GitHub OAuth, ingest, scoring, profile pages, dashboard, recruiter surfaces, and refresh orchestration are documented.
- Scoring is implemented as pure core logic across recognition, depth, craft, breadth, and specialization.
- The app deploys to Cloudflare Workers through OpenNext with Turso, NextAuth v5, Drizzle, Vitest, Playwright, and pnpm workspaces.
- Public profiles are derived, never declared: users do not edit bios, titles, skills, or scores.
- Recruiter proof improvements are complete, including score proof, recruiter explanation, evidence source labels, risk flags, next-action comparison, and a job-description evaluation demo.
- A fixture-backed resume claim audit prototype now separates candidate-supplied resume claims from verified public GitHub proof.
- Local E2E has a disposable database wrapper for reliable smoke testing without production secrets.

## Planned Next

1. Validate the MVP score with real candidate profiles and recruiter feedback.
2. Calibrate scoring weights only with corresponding core tests and methodology updates.
3. Decide whether resume claim audit should graduate from fixture prototype to live recruiter workflow with pasted resume text and selected TrueHire handles.
4. Decide whether the next extension should be candidate-side commit storytelling or deeper repo-history analysis once MVP trust or growth feedback is clear.
5. Keep recruiter proof concrete before adding broader hiring workflow features.

## Deferred / Parked

- Employer verification, reputation bonds, paid auditions, and outcome tracking are post-MVP phases.
- Candidate-written resumes, bios, skills, and profile claims remain out of scope.
- Leaderboards, generic sourcing, ATS replacement, and non-technical-role support are deferred.
