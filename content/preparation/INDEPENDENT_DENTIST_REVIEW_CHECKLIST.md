# DentPrep — Independent Dentist Review: real-world onboarding and item decision sheet

**State:** BLANK REVIEW TEMPLATE. **No reviewer has been verified and no clinical content has been approved by this document.**  
**Product:** Private single-learner DentPrep; no daily in-app admin or reviewer account required.  
**Source of authority:** `ops/MEDICAL_CONTENT_RELEASE.md`, `content/quality-policy.json`, Issue #27 and current content fingerprints.  
**Owner:** Must verify an independent dentist before recording any qualification, sign-off or review result.

## A. Owner checklist — before requesting review

1. Ask the dentist privately whether they consent to review educational content for this project and which subject(s) they are competent to review. They should be independent of the material's author and should not merely self-approve their own study content.
2. Record privately: full professional name, BDS/MDS or other recognized qualification and applicable specialty, **issuing State Dental Council, registration number and current registration status**, date and link/method of verification, subject scope, and whether there is any conflict of interest. Confirm directly against the issuing council/appropriate official register. A council entry alone does not establish specialist expertise for every dental subject.
3. Do **not** upload registration certificates, addresses, private email/phone, ID documents, handwritten signatures, passwords or reviewer private signing keys to this **public GitHub repository**. The owner may retain minimum necessary private evidence. Only publicly permitted credential metadata and a genuine owner attestation may later be added to `content/reviewers.json`.
4. Confirm that the reviewer will look at the **actual original teaching words, MCQ answers/distractors and explanations, case steps/red flags, diagrams and exact sources** rather than approving an AI summary. A reviewer may reject, revise, or withhold approval.
5. The existing published clinical content count is zero. **Never** change draft statuses, seed a reviewer, remove publication triggers or claim an approved lesson before the real clinical and release gates.

## B. Start with one bounded package, not an entire subject

- **OMR-001** Oral Medicine & Radiology — Work PR #36 prepares first source/review packet; collect its exact accepted revision before sending anything. Do **not** mix older draft bytes with a newer signed packet.
- **OMS-001** Oral & Maxillofacial Surgery — `content/preparation/OMS-001.source-audit.md` supplies a separate preliminary audit for 1 lesson, 2 MCQs and 1 case; it is **not** reviewer-approved content.
- Include **one exact version** of every document/question/answer/explanation, source title/edition/year/section/link, and item content hash. Missing or contradictory evidence must be explicitly highlighted; do not hide it from the dentist.
- Scope-reconcile curriculum outcomes and current amendments independently. A four-item pilot does **not** certify an entire subject or official UPSC exam blueprint.

## C. Copyable reviewer worksheet (one per exact content package/version)

> The reviewer fills this from their own actual review. Leave blank when unknown. No AI/autofill of professional identity or outcomes.

**Package ID and exact version:** __________________________  
**Item IDs and hashes / review bundle version:** __________________________  
**Subject and learning outcomes checked:** __________________________  
**Date of review:** __________________________  
**Reviewer full professional name:** __________________________  
**Qualification and specialization relevant to this subject:** __________________________  
**State Dental Council and registration number (share with owner privately):** __________________________  
**Owner's official verification method and date (owner fills):** __________________________  
**Independent from author? Conflict declared/resolved?:** __________________________  

| Review area | Dentist decision (PASS / REVISE / REJECT / NOT APPLICABLE with reason) | Concrete correction or exact source locator |
| --- | --- | --- |
| 1. Subject scope and exact learning outcomes | | |
| 2. Clinical facts, terminology and current guidance | | |
| 3. Each significant claim linked to the stated edition/year/chapter/section | | |
| 4. Clinical safety: contraindications, red flags, referral, Indian context | | |
| 5. MCQ stem and one defensible best answer in the scenario | | |
| 6. All answer distractors and their sourced rationales | | |
| 7. Clinical case steps, diagnostic uncertainty and consent | | |
| 8. Anatomical images: accurate labels/orientation and permission/rights | | |
| 9. Wrong-answer feedback, hints and misconception correction | | |
| 10. Corrected exact wording/item IDs and version for final re-review | | |

**Any disputed or unsupported claim? Detail and item ID:** __________________________

**Decision for EACH item:**

| Item ID + exact version | APPROVE / REVISE / REJECT | Required corrections / supported rationale / evidence |
| --- | --- | --- |
| Lesson | | |
| MCQ 1 | | |
| MCQ 2 | | |
| Clinical case | | |

**Whole packet decision:** APPROVED AS EXACTLY VERSIONED / REVISE & RESUBMIT / REJECT / NOT YET REVIEWED  
**Specific conditions or exclusions:** __________________________  
**When must source currency be checked again?:** __________________________  
**Actual dentist's declaration/attestation held by owner privately:** __________________________

### Important distinction: clinical acceptance versus software/learning quality

This worksheet is an *input* to, **not a substitute for**, the full `E01–E20` policy. The real reviewer must address applicable scientific/clinical checks and log explicit signed decisions and justifications. Other gates (e.g. student retention pilot, actual browser/device checks) cannot be faked as the dentist's examination. Record them honestly as pending where evidence is unavailable; required checks cannot be silently waived. Follow `ops/MEDICAL_CONTENT_RELEASE.md` for exact acceptance rules.

## D. After the dentist has genuinely reviewed and corrected content

1. Capture owner-verified professional registration/subject expertise **without disclosing sensitive credentials**. Preserve real decision evidence privately and reference it in versioned review records.
2. Apply the dentist's actual requested edits to a **new exact draft version**. Give that version back to the reviewer for approval: signing a previous version does not approve later edits.
3. Complete genuine claim-source records, E01–E20 decisions and controlled reviewer attestation. The repository contract requires a trusted **Ed25519** content-package signature; have the reviewer operate the approved signing process with their **private key kept in their own control**. Do not request keys in a chat and do not treat a typed name, scanned signature or synthetic key as the repository's cryptographic attestation.
4. Even a signed package **cannot** publish by itself. Separately implement and verify the authorized database importer/publisher, version/withdrawal handling, audit history and the three existing publication guards; require native role tests, full CI and live learner acceptance before changing any actual clinical status.
5. Publish **only** the approved content version(s) to Dr. Garima's account, not the whole subject. Record verified live revision, source version, reviewer/owner attestations, exact item IDs and correction/withdrawal procedures.

## E. Division of work / no duplicate Work tasks

**Work PR #36** owns OMR-001 and student learning UI.  
**Normal Chat PR #37** owns OMS-001 research audit.  
**This document** is a reusable **blank human-review checklist only**, changing no clinical content, database rows, policy or UI.

Once an actual dentist's **professional name, recognized qualification, issuing council, registration number and subject expertise** are supplied, verify eligibility (privately and with official sources where possible), scope the initial **OMR-001** review bundle against latest Work revision, then request a genuine human review. **Never infer that the dentist being available means review is already complete.**
