# Day 1 nonclinical starter — normal-chat / Work split

Issue #27 is the single-learner authority. This task is separate from Work PR #29 on clinical sources, reviews and approval gates.

- Adds a public /start route, linked from the homepage and signed-in dashboard.
- Four evidence-linked general study-skills units, each with a lesson, self-check, optional hint, corrective retry and explanation after a correct response.
- Student can begin without a validated account. Guest answers/completion are not persisted.
- For a signed-in student only, finishing calls the existing log_activity RPC once, recording an activity event without retaining individual answers, simulated mastery, XP, or exam accuracy.
- No clinical claims or unpublished content; all dental lessons/MCQs/cases remain draft and guarded.
- Primary learning-science source: Dunlosky et al. 2013, PMID 26173288 (https://pubmed.ncbi.nlm.nih.gov/26173288/); also Roediger & Karpicke 2006, PMID 16507066 (https://pubmed.ncbi.nlm.nih.gov/16507066/).
- Governance references: GitHub Issue #27 and https://upsc.gov.in/ .
- A qualified dental reviewer is still needed before any genuine clinical quest may be published. These exercises are **not** BDS teaching and do not replace structured medically reviewed content.
- Starter state is only in component memory and restarts on refresh. Account activity is the only persistent server event. Browser/mobile tests simulate auth and verify both guest and logged-in cases.
- No database schema, roles, clinical review tables, content versions, worker config or auth logic changed.
- This task has intentionally no overlap with PR #29. Recheck main and open PRs before merging.

Future task: once source/clinical approvals exist, use the reviewed quest manifest and private database progress to replace the temporary introductory quest with the full source-controlled Codédex-like curriculum.
