# Source-linked study + MDS feedback workflow (24 November 2026)

This change does **not** publish clinical lesson drafts or mark any review as approved.

## Public study resources

1. **Oral Medicine & Radiology:** ADA 2026 Oral Cancer Guideline (publisher and chairside guide). Source already registered in `content/drafts/OMR-001.review.json`; source version, clinical scope and jurisdiction require specialist reconciliation.
2. **Oral & Maxillofacial Surgery:** SDCEP *Management of Dental Patients Taking Anticoagulants or Antiplatelet Drugs*, second edition (2022), with a Scottish/UK clinical-context warning.
3. **Public Health Dentistry:** CDC *Summary of Infection Prevention Practices in Dental Settings* and current linked dental infection-control resources, accessed 24 November 2026; US guidance, not an Indian legal practice standard.

The library now provides all three **publisher-hosted references**, search/category filtering, reading steps and review worksheets. It does not reproduce copyrighted material or assert official UPSC syllabus coverage.

## MDS review worksheet

Each reading card offers **Prepare senior MDS feedback form**. The user may enter the senior's asserted name, specialty, council registration, recommendation, and detailed correction evidence, then copy the worksheet. The form intentionally does not persist or submit records, validate registration, or unlock clinical publication. Users should not input patient-identifiable data. The copied worksheet must be handed to the authorized content administrator for credential verification and controlled ingestion.

## Later durable submission system (not implemented)

- Authorize named reviewers via independent registry and verified relevant specialist credentials; never trust self-declared form fields as certification.
- Bind each review to exact immutable item ID, version, content digest, corresponding subject, source locators, rationale and review time.
- Require per-claim verification and 20 academic gates, safe answer-key handling, specialist decision, dual-control publication, append-only audit history and withdrawal/re-review.
- Notify admins of pending feedback; corrections create new draft versions, not silent live edits.
- Keep unapproved clinical items out of the published lesson and scored practice APIs.

Current content checks in `scripts/check-content-release.mjs` must remain strict. No clinical draft status or publication gate is modified by this PR.
