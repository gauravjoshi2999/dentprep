# DentPrep — UPSC Dental Surgeon Preparation

Independent English-medium BDS revision, clinical reasoning and UPSC Dental Surgeon interview preparation. **This project is not affiliated with or endorsed by UPSC.** No custom mock is an official UPSC exam or interview score.

## Project status (23 November 2026)

This repository is a **manual import** of the user's existing [DentPrep Learning Hub Lovable project](https://lovable.dev/projects/7e700199-451a-4c24-bbea-d410d796df0b), with a functional database-backed landing page on this import branch. A Lovable → GitHub automatic synchronization is **not yet verified**. Do not treat a GitHub commit as a Lovable live deployment.

Existing backend: 15 published subject categories and a verified UPSC notice; 15 draft learning lessons, 30 draft original practice questions (four options each), and 15 draft clinical case outlines. **Draft clinical material is not medically reviewed and must not be published automatically.** The complete candidate learning flows, AI interviews, and Android APK are not yet implemented.

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
