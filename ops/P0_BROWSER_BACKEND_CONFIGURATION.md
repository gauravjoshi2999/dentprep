# Production P0: browser public backend config

As observed in [release 45306134069](https://github.com/gauravjoshi2999/dentprep/actions/runs/45306134069), HTTP 200 and correct revision were **not** proof of a usable site. Fresh browser checks hit the TanStack root error boundary for every visited route, and browser console logged missing public Supabase config.

The production GitHub workflow provides `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to `npm run build:release`, and the release builder checks their presence in a client bundle. But the live runtime did not receive those values in the code path initializing the Supabase client.

This PR configures explicit **build-time Vite defines** for both known-public values. It does not add server-only keys, expose service-role credentials or modify user data/roles. It guards against accidentally inlining a secret/service-role key. Unconfigured local development is still allowed; production build-release prerequisite checks continue to reject missing public variables.

Do NOT assume this fixes production until the post-merge GitHub release passes **both**:
1. Exact deployed SHA + /api/health + hashed assets.
2. Real clean desktop/mobile browser routes with **no** root error boundary and **no** missing Supabase variables in console.

If this fails, inspect the emitted client chunk, startup code and browser test receipts before further deployment. Never weaken or skip the live browser gate. Work PR #32 owns build-revision pipeline separately; this PR does not edit package.json or scripts/build-*.mjs.
