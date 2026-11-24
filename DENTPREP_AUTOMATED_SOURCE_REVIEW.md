# Automated source preparation — first Oral Surgery unit

24 November 2026. AI performs retrieval, draft critique and software integrity checks; it does not claim to be an MDS, authenticate a dentist or provide independent clinical approval. The founder's request for autonomous review authorizes this preparation and safe software release. It supplies no actual human credentials or signature. Issue #27, all three native clinical publication guards and the 20 academic gates remain in force.

## Completed preparation scope

`content/drafts/OMS-001.review.json` binds the existing lesson, two questions and one case to their native content fingerprints, and the existing v0.2 revision candidate to its SHA-256. It records eight directly opened institutional pages, exact sections, publisher/organization, edition/year (explicitly unknown where absent), source-check date and content version. The original clinical items, answer keys, explanations and candidate v0.2 are retained unchanged.

Findings requiring revision: incomplete pre-extraction MCQ answer versus its broader explanation; very weak distractors; missing bleeding severity/systemic context; and an anticoagulant case that does not identify the drug or procedure. SDCEP's VKA and DOAC guidance cannot be interchanged. Detailed technical/disease-specific teaching in v0.2 still lacks its own exact topic sources. Indian applicability and independent assessment of all options/rationales remain open. These are AI source-comparison findings, not accepted medical decisions or accuracy scores.

The learner's Oral Surgery reference card adds six direct reading-section links: IDA assessment/consent/ongoing care, SDCEP bleeding-risk assessment, VKA, DOAC, post-extraction haemorrhage and emergency prioritisation. It displays editions, locators and India/UK context. This is original-source navigation, with no draft notes, clinical answers, scores or published-lesson increment. The September 2026 supporting practice guide is distinguished from the March 2026 acute guidance edition.

## Reproducible checks and additive backend preparation

The required `check:content` validates enhanced draft packets against the existing inventory and candidate bytes. Source dates/URLs, exact locators, unresolved issues and AI provenance are checked. It rejects stale identities/hashes, passed academic gates, invented approval fields, source-substitution and MCQ validity claims. This checks metadata consistency; a source can still be scientifically wrong, obsolete or misinterpreted despite passing software checks.

```bash
npm run test:content
npm run check:content
node scripts/prepare-draft-evidence.mjs OMS-001 --verify
node scripts/prepare-draft-evidence.mjs OMS-001
```

Both preparation commands only print SQL and have no database connection. The verification output uses a temporary helper inside a rolled-back transaction and exercises the exact compiled apply body: insert, duplicate retry, stale fingerprint, changed preparation version and colliding retry request. It never edits the teaching records or creates a real account/role. The generated transaction is committed as `ops/prepare-oms-source-evidence.sql` for review; regression tests reject divergence from its packet.

After local integrity/type/unit/release checks and native rollback QA, the additive transaction was executed through the existing DentPrep Lovable SQL connector at 07:44 UTC. Four version-1 preparation records now exist in `content_curriculum_evidence`, with matching native draft fingerprints. The transaction checks the three publication guards, native draft fingerprint/status/subject and expected evidence version while holding content/evidence locks. Identical retry reuses each record. `created_by` is NULL for owner-operated AI preparation and notes explicitly identify the AI provenance; no dentist/user is impersonated. It contains no role/grant/schema, answer-key, clinical-status or medical-approval writes. Native post-install checks confirm RLS enabled, no direct authenticated INSERT grant, three guards and unchanged 15/30/15 clinical draft counts. Full software CI and a SHA-specific production artifact remain necessary for the UI release.

## Acceptance and continuation

See `ops/qa/oms-source-preparation-2026-11-24.json` and the final PR/Issue #27 acceptance comment for native test, installation and exact release evidence. Clinical content remains 15 draft lessons, 30 draft questions and 15 draft cases. Zero independently approved clinical releases and zero published clinical lessons are claimed.

Next: resolve the bounded OMR-001 source gaps and prepare another untouched subject's exact-item audit, using primary sources rather than repeating OMS v0.2. Turn actual corrections into new candidate versions and keep their history. Genuine independent qualified review must cover the final exact content and all 20 relevant academic checks before a separately accepted clinical importer/withdrawal service can publish. Do not populate the trusted reviewer roster with AI or treat feedback receipt, reading completion, XP or source lookup as approval/mastery. Work and normal-chat tools may continue source preparation without buying services or repeatedly asking the founder to continue.
