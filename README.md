# DentPrep — UPSC Dental Surgeon Preparation

Independent English-medium BDS revision, clinical reasoning and UPSC Dental Surgeon interview preparation. **This project is not affiliated with or endorsed by UPSC.** No custom mock is an official UPSC exam or interview score.

## Project status (23 November 2026)

This repository is a **manual import** of the user's existing [DentPrep Learning Hub Lovable project](https://lovable.dev/projects/7e700199-451a-4c24-bbea-d410d796df0b), with a functional database-backed landing page on this import branch. A Lovable → GitHub automatic synchronization is **not yet verified**. Do not treat a GitHub commit as a Lovable live deployment.

Existing backend: 15 published subject categories and a verified UPSC notice; 15 draft learning lessons, 30 draft original practice questions (four options each), and 15 draft clinical case outlines. **Draft clinical material is not medically reviewed and must not be published automatically.**

Implemented candidate routes include `/dashboard`, `/library`, lesson reading, completion/bookmarks, `/practice`, server-scored sessions, `/progress`, `/saved`, 7/15/30-day `/plan`, and private text interview communication rehearsals at `/interviews`. The latter uses rule-based prompts, not AI assessment. Clinical teaching stays unavailable until content review.

`/admin` uses database role checks and RLS. It creates/edits drafts, submits content for review, archives and restores content, and shows a status-change audit trail. It cannot certify clinical review or publish content. There are no automatically assigned administrator accounts.

Database hardening is recorded in `ops/harden-learning-access.sql` and verified by rollback-only adversarial checks in `ops/verify-learning-access.sql`. It restricts public RPC execution, hides direct correct-answer flags, validates question sets, enforces timer expiry and serializes answer writes with submission. Admin question edits use an atomic, permission-checked RPC. These scripts are applied through the existing Lovable database connection; generated migration files are preserved.

CI runs source checks, TypeScript, unit tests, SSR build and Chromium acceptance tests for desktop and mobile viewports. Browser tests use isolated mocked backend data. Real production sign-in, physical-device acceptance and deployment are separate checks.

## PWA and offline notes

The manifest and service worker support installation on compatible HTTPS browsers. The worker caches only the separate offline reading page and its public assets. Authenticated HTML, API responses, server functions, answers, study plans and interview transcripts are never cached. On network failure, navigation opens the public offline reading shelf.

Candidates can explicitly save a published lesson with a recorded review date on their device. Offline notes are plain text and show their review/save dates; they can become stale, so reconnect to check for updates or withdrawal. The reading shelf lets users remove each copy. Offline quizzes, scoring, account changes and interviews are unavailable. Build-time hashing updates the worker whenever offline assets change. Development registration is opt-in with `VITE_ENABLE_PWA=true`.

The separate [Android configuration](android/README.md) builds a Trusted Web Activity wrapper against the deployed SSR app. The default `example.invalid` URL is configuration verification only. A usable release needs a verified production URL, signing certificate, Digital Asset Links and physical-device QA; no production APK or Play Store release is claimed.

## Stack

React 19, TypeScript, TanStack Start, Tailwind CSS, Lovable Cloud / Supabase PostgreSQL. Test tooling: Vitest.

## Get started

1. Install Node.js 24 (see `.nvmrc`).
2. Run `npm ci` using the committed lockfile.
3. Copy `.env.example` to `.env` and enter DentPrep backend's public URL and publishable key. Never commit `.env`.
4. Run `npm run dev`.
5. Run `npm run check:security`, `npm run typecheck`, `npm test` and `npm run build` before merging changes.

**Deployment note:** This project uses TanStack Start SSR and server middleware. Do not host it as a purely static GitHub Pages site without a separate deployment strategy. Provide the intended runtime and Supabase settings when deploying to a supported host.

## Safety rules

- Keep the Bite `restaurant-os` repository separate.
- Never commit credentials, service-role secrets, or user private data.
- Only publish lessons, cases and practice questions after qualified professional review.
- Recruitment facts must link to verified official UPSC notices, not unverified social media or a fabricated interview syllabus.
- Run CI and review the code before merging pull requests.
