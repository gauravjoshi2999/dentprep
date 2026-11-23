# Release evidence

## Audit baseline — 2026-11-23

- GitHub main: `4b92b5e75f12f7b7254784c8a865fad305e8bf1f`.
- Live: https://dentprep.gauravjoshi2999.workers.dev ; `/api/health` returned HTTP 200, app `dentprep`, status `ok`, exactly the same revision.
- CLI `verify:deployment` passed complete SSR, built script/style resources, login/library, offline page, manifest and worker checks.
- CI [45231986282](https://github.com/gauravjoshi2999/dentprep/actions/runs/45231986282) and production [45231986266](https://github.com/gauravjoshi2999/dentprep/actions/runs/45231986266) succeeded. Previous failed releases are historical, not the current deployment.
- Current production workflow already deploys tested main using protected Cloudflare secrets and validates the exact receipt and the full guest mobile/desktop route suite. Do not recreate it or request the secret values.
- This session's Cloud Browser failed opening `/login` with HTTP response failure; observation then explicitly failed its URL-policy authority gate. This is a browser access restriction, not proof the deployed app is broken or the user has a bad password. No workaround was attempted.

For each new accepted task append code head/PR/merge, CI logs, database installation/enforcement, deployed revision/URL and live verifier result. Actual auth, mic, clinical review and hardware tests remain separate gates. Never put tokens or raw user data here.

The required production workflow now writes a SHA-specific `dentprep-release-SHA` artifact after its required checks and a final fresh health comparison. This provides the exact revision/run/time of the checkpoint deployment without an impossible self-referencing commit SHA inside this Markdown file. Tracked ledger snapshots state their verified baseline; always use live health and the latest successful workflow artifact to resolve current production truth.

## P0-01 accepted release

Current verified application revision at this checkpoint: `98bf0db3f477c066adda862f31b8257ddf4c2937`; [PR #18](https://github.com/gauravjoshi2999/dentprep/pull/18). Required production run [45241181580](https://github.com/gauravjoshi2999/dentprep/actions/runs/45241181580) passed and produced artifact `14849954993`. Exact same live origin. Backend column enforcement followed deployment and passed real rollback-only SQL tests plus live REST permission denials. See completion ledger for counts/scope; no clinical approval or physical-device acceptance is claimed.
