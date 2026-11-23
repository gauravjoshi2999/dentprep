# DentPrep release on Cloudflare Workers

This is a hosting configuration for the existing application and repository, not a new app or database. It keeps TanStack Start SSR, existing Supabase RLS and all clinical drafts. No Lovable generation credits are used. Never deploy the older unconnected Lovable scaffold as this release.

## Prepare a release

1. Start from a clean, committed, tested `main` checkout using Node 24 and `npm ci`.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to DentPrep's public backend configuration, using local ignored `.env` or environment variables. Server runtime variables use that public endpoint too; do not copy Lovable's private/internal runtime URLs.
3. Run source security, type, unit and browser checks. Run `npm run build:release`, `npm run check:worker` and `npm run test:worker`. The build generates an ignored `.output/release.wrangler.json` with only public backend variables. Do not upload `.env`, the source directory, or Supabase service-role credentials as assets.
4. Deploy with an authenticated, user-owned Cloudflare account using `npm run deploy:worker`. This creates/updates only the `dentprep` Worker. Check the account and existing Worker before a first production deployment. No custom domain or other Worker is changed. The existing account plan's quotas apply; do not enable a paid plan to bypass quota failures without the owner's approval. Passing local Worker checks cannot prove production CPU quotas or real backend connectivity.
5. Verify the exact URL returned by Wrangler with `npm run verify:deployment -- HTTPS_ORIGIN FULL_GIT_SHA`. Deployment success alone is not evidence of the expected live code.

`/api/health` is a no-cache liveness receipt with only the app name, status and a validated full commit SHA. It does not query the database, reveal environment values, or certify auth/content. An unversioned build returns HTTP 503 so it cannot pass a release check.

`--allow-test-backend` is only for CI packaging/dry-run verification, never a real deployment. Never run `deploy:worker` on a build using that option.

## CI for subsequent releases

The manually dispatched **DentPrep production release** workflow runs only on `main`, through the GitHub `production` environment. Configure repository/environment variables `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` using GitHub's secure settings. Use a Cloudflare token scoped to the intended account and Worker deployment permissions; never place it in chat, source, a build artifact or a `VITE_` variable. The token is supplied only to the deploy step. No deployment runs automatically from forks or pull requests.

The workflow runs the full checks and live verification against the supplied production origin. A failed live check means the release is **unverified**; inspect the actual Worker URL and rollback with Cloudflare's previous deployment if necessary. Do not report a green build as a verified deployment.

## First deployment without a hosting account

Cloudflare supports `wrangler deploy --temporary` with a claim URL. This is an optional preview, not durable production: its terms must be accepted, and the intended owner must finish claiming it within 60 minutes or Cloudflare deletes it. Obtain that decision before provisioning it. Keep its claim URL and temporary token private, outside GitHub/CI logs. Do not commit them. The regular workflow above never provisions temporary accounts.

## Auth and acceptance after hosting

Add the final HTTPS origin and `/reset-password` redirect in the existing DentPrep auth provider's URL configuration before testing email recovery or OAuth. Do not broaden allowed redirects to `*`. Use real candidate/admin test accounts only with authorization and keep their records separate from content. Verify logout/account-switch isolation, scoring, draft visibility, offline shelf behavior and installation in desktop/mobile browsers. Do not report mocked CI sessions as real production acceptance.

Permanent hosting account authorization, first deployment, correct auth redirect configuration, authenticated production acceptance and physical Android QA are still separate release gates. A usable Android build additionally needs the verified HTTPS URL, signing and Digital Asset Links described in `android/README.md`.

References: [Cloudflare Workers configuration](https://developers.cloudflare.com/workers/wrangler/configuration/), [temporary deployment lifecycle](https://developers.cloudflare.com/workers/platform/claim-deployments/), [Nitro Cloudflare output](https://nitro.build/deploy/providers/cloudflare).
