# Medical accuracy release contract

Authority: founder's mandatory medical accuracy instruction and open Issue #27. Scope is one private student; no daily admin/reviewer portal. Editorial packages are reviewed outside the learner's study flow.

## Current verified state

`content/draft-inventory.json` captures native metadata/content fingerprints, not approval: 15 lesson/30 question/15 case drafts, no per-item clinical source rows, no independent approval, zero published clinical items and three enabled DB interlocks. The three legacy source rows describe a recruitment notice. Every clinical draft and its explanation remains BLOCKED. No substantive clinical source or qualified reviewer is invented.

`content/curriculum.json` and `DENTPREP_CURRICULUM_COVERAGE.md` organize all 15 application groups into 90 broad proposed outcomes. These are an incomplete editorial inventory; exact sections, fine-grained essential outcomes and current amendment reconciliation still need qualified review. No official UPSC syllabus/weightage or coverage percentage is asserted. Historical regulator references and their limited permitted use are in `content/source-register.json`.

## Commands and enforcement

- `npm run test:content`: nonclinical, in-memory signing/negative regressions, including each E01–E20 gate. Synthetic credentials/keys are never exported to the real roster or DB.
- `npm run check:content`: validate catalog/inventory/policy, immutable archived snapshots, withdrawals and every candidate clinical package. Unsigned/untrusted/stale/incomplete packages fail CI and the production release before deployment. An empty release directory permits the application with all clinical teaching still locked; it does not mark academic gates passed.
- Both required GitHub CI and production release run these commands. The npm build/build:dev lifecycle also enforces check:content, including builds invoked by build:release, so these npm build entry points enforce the same package gate. The private external build configuration itself was not inspected. The validator has no database credentials/client/publisher. Existing DB publication triggers are unchanged. No teacher content has been seeded or released.

## Real review preparation

1. Independently reconcile granular outcomes and primary current reference sections; do not approve an AI-generated claim by its citation formatting alone. Source title, author/organization, edition/year, chapter/section, HTTPS link/identifier, document hash, review/due date and content version are mandatory per source; each factual claim links to that source and exact locator. Contradictory/outdated/disputed/unsupported evidence blocks release.
2. For every lesson, question, explanation, case and illustration supply versioned claim inventory and content hash. Questions need one best answer in bounded context, distinct alternatives, sourced rationale for every distractor, an ambiguity resolution and reviewed concept explanation/remedial lesson. Structural correctness is not single-best-answer medical validity.
3. Images need actual matching asset bytes, licensing/permission, accurate alt text, labels/orientation and expert-check evidence. Do not treat decorative design images or an AI-generated anatomical figure as verified anatomy.
4. A genuine independent dentist must review the material. Owner verifies qualification/registration/current scope using external credential evidence before adding a public verification key to `content/reviewers.json`. The roster is deliberately empty. `verified_by_owner` and credential evidence must be supplied by an accountable human, never filled by AI. Private keys stay with the reviewer. A valid signature checks integrity of that human attestation, not the truth of medicine or the legal validity of credentials by software.
5. Reviewer records every one of the 20 quality checks in `content/quality-policy.json`. Required checks cannot be waived; nonrelevant checks need explicit signed justification. E19 is adapted to a consenting single learner under Issue #27; it cannot produce a learning-validity/readiness claim without a genuine pilot. E20/quest contracts disallow XP-as-competence and exam-readiness claims.
6. Review signature uses Ed25519 over UTF-8 `reviewPayload(package)`; `packageDigest` is SHA-256 of those same bytes. Each item's `content_sha256` uses `itemDigest`. The signature binds exact curriculum snapshot, sources, teaching/option/feedback versions, all gates and error procedures. Changes require new version/review; old snapshots and item versions remain in `content/history/`.

## Learning and withdrawal boundaries

A future reviewed quest bundles concept, hints, retrieval, verified corrective explanation, remediation, separate fresh and 1/7/30-day questions and a transfer case. Reused IDs or identical re-keyed question text cannot masquerade as fresh retrieval. This offline contract does not yet enforce actual learner exposure, perform delayed retrieval, validate semantics or claim mastery; the runtime quest engine and consenting learner evidence are separate work.

Record reported errors/withdrawals in the versioned registry; unresolved affected IDs block a package. Resolution must retain evidence and correction-release identity. Immutable archived bytes/item hashes cannot be overwritten or rolled back. These repository checks are not a production withdrawal/score-regrading service: before a future publisher is accepted, DB withdrawal/enforced versioning, preservation of original attempts and accountable correction provenance must pass real native tests. No such service is claimed by this release.

## Safe normal-chat continuation

Read latest main/live, Issue #27 and `DENTPREP_NEXT_ACTIONS.md`; do not rebuild existing safeguards. Split each of the 90 broad proposals into essential outcomes using real source locators, list omitted topics, and obtain qualified scope reconciliation. Prepare original claim-linked material in draft packages; arrange genuine independent credential/review evidence. Do not generate a fake signed release or disable guards to demonstrate a vertical slice. After real approval, implement/test a repository importer and one guided quest with actual unseen/delayed exposure handling. Ordinary ChatGPT can do schemas, inventories, source lookup, draft preparation and connector-based PR/testing when available. Medical approval, legitimate learner identity and physical device/session evidence require the real people/access involved.

Static UI audit found a labelled molar cross-section outside lesson records. It had no authoritative source or expert label/orientation review. It is withdrawn from homepage/study headers in this change; the original remains in Git history. Existing decorative aria-hidden branding is reused. This finding shows that a zero lesson-image-markup count was not proof of zero anatomical illustrations. Public home/library regression checks prevent its unreviewed display.
