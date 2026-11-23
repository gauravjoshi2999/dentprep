# DentPrep — next actions

Read the completion ledger first; recheck main and live SHA before writing. Last accepted application checkpoint: `e3b3ee74db3e8357175189a0907a8463ccae24af` (PR #23; production 45251461187 SUCCESS). P0-01 confidentiality and P0-02 publication interlock are complete technical gates; do not redo them.

## Next three tasks

1. **P2: finish Android debug target/build QA.** Files: `android/app/build.gradle`, Android workflow and readmes. Existing verified live `/dashboard` replaces placeholder; full exact web revision/asset checks precede debug+lint. Require successful main/PR Android build, APK checksum/certificate/evidence artifact and verified compatible web release. No production key/asset links/hardware claim. Normal chat can inspect/edit and run CI through GitHub; actual installation/account QA needs permitted physical hardware. Native draft-isolation SQL already passed and rolls all fixtures back. Do not redo accepted PRs #18–23.
2. **P0: complete real-account acceptance when permitted.** Files: scenario matrix T06-T10, auth/provider settings, privacy routes. PR #20 already merged/live; do not recreate the identity-scoped subtree. Main CI 45246246939 and production 45246246768 passed. Authorized A/B users must validate signup/login/recovery/logout/account switch and admin boundaries. BLOCKED here by explicit Cloud Browser policy; do not work around or request passwords in chat. Ordinary chat may inspect connected service configuration; actual browser/hardware requires permitted access.

3. **P1-02: curriculum and review evidence.** Map subject/unit/topic/outcome to drafts, sources and independent reviewer evidence. Do not publish or claim clinical accuracy. Normal chat can build source/coverage/review tools; only qualified accountable humans can approve content.

## Access truth

GitHub read/write, existing Lovable DB and the already configured GitHub Cloudflare release pipeline are available; do not ask for their credentials again. Use only scoped existing secrets inside the production deploy step.

Cloud Browser could not load the live login page and the URL policy denied observation of the resulting page. Record real-account browser work as BLOCKED. Do not bypass this through alternate browser surfaces or put credentials in chat. Human account/device QA, authorized reviewer evidence and any paid provider approval cannot be manufactured in code.

## Continuation message

Continue DentPrep from the latest verified main, GitHub issues and DENTPREP_NEXT_ACTIONS.md. Take the highest-priority safe task supported by the currently connected tools. Audit → implement → test → PR → QA → safe merge → verify live revision. Do not redo completed work or mark unverified work done. Save the result, exact next command and remaining Work-only steps back in the repository. No background continuation is implied.

## Exact next operation at this checkpoint

Read the PR/CI/Android jobs for `fix/android-live-launch-target`; require full web CI plus debug assemble/lint, exact launch target and artifact evidence. After safe merge, verify production/main and the main Android artifact. Record accepted commit/run/URL/hash and update this handoff. No backend migration is needed. The Lovable source import is manual/unconnected; preserve GitHub production and the existing backend instead of creating a replacement repo. Then take P1 source/unit/topic/outcome and independent-review evidence tooling, keeping clinical drafts locked.
