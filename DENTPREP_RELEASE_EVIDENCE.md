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

## P0-02 accepted release

Merge/live `a6ea77536aade2356a051f0b6c089aa012fcd586`, PR #19; production [45243391806](https://github.com/gauravjoshi2999/dentprep/actions/runs/45243391806) SUCCESS; exact-release artifact `14852357391`. Native DB regression confirmed publication lock and unchanged draft/user counts with no persisted QA user. No reviewed medical material was published.

## P0-04 account-local state isolation release

PR #20, head `ce90671c5f9979b2118f1be4f04583ba52d2fb1f`, merge/live `889cb9bcf6767a31a0ca5bf8460a47bb56aabb6b`. PR CI 45245114228 SUCCESS; production [45246246768](https://github.com/gauravjoshi2999/dentprep/actions/runs/45246246768) SUCCESS; artifact `14853303268`. Fresh CLI exact revision/SSR/assets/routes/PWA PASS. Main CI 45246246939 SUCCESS (19 fixture browser tests passed, one intentional desktop skip). No database mutation. Real-account browser/device gate remains BLOCKED.

## P1-01 accepted release

PR #21, head `e25caad72e74c2f508f33a72d518243801b3eca4`, merge/live `15a68141d84ee813c3e383cb30ec24d502a549d4`. PR CI 45247389604, main CI 45247885358 and production [45247885359](https://github.com/gauravjoshi2999/dentprep/actions/runs/45247885359) SUCCESS. Artifact `14853939298`. Fresh exact-SHA CLI verification PASS. Expand/contract and native rollback regression PASS, original 1 user/1 plan/30 tasks retained; owned lineage empty before actual learner renewal. Full clinical/adaptive/real-device gates remain separate.

## Score/revision integrity accepted release

PR #22, head `621cc0834803f9bdbb4a63782eed6c35fcbbe949`, merge/live `137985adfeeaea1114d803b0688f8c2ac063f6e2`. PR CI 45248990949, main CI 45249547705 and production [45249547837](https://github.com/gauravjoshi2999/dentprep/actions/runs/45249547837) SUCCESS; artifact `14855490953`. Exact-SHA CLI PASS. Native regression and grant/search-path enforcement PASS, QA rows rolled back, publication guard enabled; 1 user and original clinical draft counts unchanged. Separate real-account, regrading/versioning and clinical-validation gates remain pending.

## P1-03 accepted release

PR #23, head `cdb8029d31911d60288c3e6ffa221d56c9356017`, merge/live `e3b3ee74db3e8357175189a0907a8463ccae24af`. Main CI 45251461255 and production [45251461187](https://github.com/gauravjoshi2999/dentprep/actions/runs/45251461187) SUCCESS; artifact `14854928788`. 44 unit/11 release/23 nonclinical fixture browser passes, one intentional desktop skip. Fresh exact-SHA CLI PASS. No DB change. Native draft isolation also passed with 1 real user/15-30-15 drafts/three guards intact and all synthetic rows rolled back. This remains technical acceptance, not medical/real-device validation.

## Android/main accepted checkpoint

PR #24 final head `910d20d3ea187474ac8885e842f907089b8f8314`, merge/native/web `cc140559ff628371d7cc1ca65c044f00369be20a`. Main CI 45253304791, production [45253304850](https://github.com/gauravjoshi2999/dentprep/actions/runs/45253304850) and Android [45253304800](https://github.com/gauravjoshi2999/dentprep/actions/runs/45253304800) SUCCESS. Web artifact `14857143951`, Android artifact `14856519438`. Exact-SHA CLI PASS. Actual downloaded APK checksum/compiled URL/package and matching web/native receipt PASS; `ops/qa/android-debug-pr24.json` preserves inspection evidence. Debug APK SHA-256 `da4f3260f83ea8b260efa794d21c03ff8bc1cce3d55e2c4b793a37f2153a255b`.

The debug artifact is retained seven days and may need rebuilding later. Production signing, asset-links ownership, physical installation/accounts and store release are not passed. Handoff-only commits must still pass required CI/release; their exact SHA is in the workflow's release artifact and final PR verification comment, rather than a self-referential source file.
