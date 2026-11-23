# DentPrep 100 Q&A requirements

SOURCE: Q&A, uploaded Final Master Specification, SHA-256 `25ebe945dec661912a9408c6c5118bf8851587b069f83b9e365efa974e7d49c1`. PDF physical pages 6–15. These are requirements, not proof of implementation. Baseline audited main: `4b92b5e75f12f7b7254784c8a865fad305e8bf1f`.

Statuses are conservative: Partial = existing implementation with missing acceptance; Missing = important required behavior absent; Blocked = accountable human/provider/device gate. Per-task changes are recorded in the completion ledger.

## Q001 — Kya DentPrep ek student ko UPSC Dental Surgeon ke liye poori taiyari kara sakta hai?

- SOURCE: Q&A, PDF p.6; status: **Partial**.
- Required: Target: ek structured primary preparation platform, lekin abhi content incomplete hai. Exam success guaranteed nahi; content coverage, clinical review, practice retention, aur real candidate QA ke baad hi exam-ready kehna hai.
- Code/data: /dashboard, /login; profiles, attempts; src/lib/auth.tsx.
- Acceptance: T01,T06-T10,T48; see scenario matrix for actual evidence.

## Q002 — Kya sirf app par depend karna safe hoga?

- SOURCE: Q&A, PDF p.6; status: **Partial**.
- Required: DentPrep mein verified notes, MCQs, cases, interview practice aur official links hone chahiye. Student ko authoritative textbooks, official notices aur qualified clinical teaching ke saath cross-check ka option hamesha mile.
- Code/data: /dashboard, /login; profiles, attempts; src/lib/auth.tsx.
- Acceptance: T01,T06-T10,T48; see scenario matrix for actual evidence.

## Q003 — Kya app UPSC ka official partner hai?

- SOURCE: Q&A, PDF p.6; status: **Partial**.
- Required: Nahi. Har relevant screen par independent educational tool ka disclaimer dikhe. UPSC logo/endorsement, authorized question bank, official exam scores ya selection guarantee imply na kare.
- Code/data: /dashboard, /login; profiles, attempts; src/lib/auth.tsx.
- Acceptance: T01,T06-T10,T48; see scenario matrix for actual evidence.

## Q004 — Exam ki date announce nahi hui toh study kaise chalegi?

- Implementation: renewable-cycle/history/carry source and rollback SQL QA implemented; PR #21 CI/live/native expand-contract verified; actual account/device acceptance pending. No full adaptive/official-date behavior claimed.

- SOURCE: Q&A, PDF p.6; status: **Partial**.
- Required: Exam-date-unknown mode hamesha available rahe. Syllabus mastery aur revision indefinite chalte rahein; official date verified hone par hi countdown aur priority reshuffle ho.
- Code/data: /dashboard, /login; profiles, attempts; src/lib/auth.tsx.
- Acceptance: T01,T06-T10,T48; see scenario matrix for actual evidence.

## Q005 — Kya exam pattern, marking ya cutoff app bana sakta hai?

- SOURCE: Q&A, PDF p.6; status: **Partial**.
- Required: Nahi. Official advertisement aur latest corrigenda mein jo documented ho wahi display ho. Unannounced written RT scheme, marking, weightage ya interview rubric ko Unknown/Unconfirmed mark karo.
- Code/data: /dashboard, /login; profiles, attempts; src/lib/auth.tsx.
- Acceptance: T01,T06-T10,T48; see scenario matrix for actual evidence.

## Q006 — Padhai ka target BDS syllabus hai ya sirf UPSC notification?

- SOURCE: Q&A, PDF p.6; status: **Partial**.
- Required: Core learning 15 BDS groups aur clinically relevant public-service skills ko cover kare; official recruitment requirements ek separate verified layer hon. Dono ko milakar invented UPSC syllabus na banao. DentPrep | Independent education | Verified-source work handoff
- Code/data: /dashboard, /login; profiles, attempts; src/lib/auth.tsx.
- Acceptance: T01,T06-T10,T48; see scenario matrix for actual evidence.

## Q007 — Kya har learner ke liye ek hi roadmap rahega?

- SOURCE: Q&A, PDF p.7; status: **Partial**.
- Required: Nahi. Starting baseline, existing knowledge, daily hours, practice errors aur retention results ke hisaab se adaptive path ho. User chahe toh manual adjustments bhi kar sake.
- Code/data: /dashboard, /login; profiles, attempts; src/lib/auth.tsx.
- Acceptance: T01,T06-T10,T48; see scenario matrix for actual evidence.

## Q008 — Kya har student ki progress alag save hogi?

- SOURCE: Q&A, PDF p.7; status: **Partial**.
- Required: Haan, own account ke liye RLS-protected progress, answers, plans, bookmarks, interview transcripts. Logout/account switch par private cache clear ho aur cross-user data leakage test ho.
- Code/data: /dashboard, /login; profiles, attempts; src/lib/auth.tsx.
- Acceptance: T01,T06-T10,T48; see scenario matrix for actual evidence.

## Q009 — Kya design images mein jo accuracy 86.4% hai wo real hai?

- SOURCE: Q&A, PDF p.7; status: **Partial**.
- Required: Nahi. Woh illustration sample hai. Production par authenticated learner ke actual submitted answers aur defined denominator se calculated result hi dikhe; no attempts par blank/Not yet measured.
- Code/data: /dashboard, /login; profiles, attempts; src/lib/auth.tsx.
- Acceptance: T01,T06-T10,T48; see scenario matrix for actual evidence.

## Q010 — Kya purani chats ka kaam phir se banega?

- SOURCE: Q&A, PDF p.7; status: **Partial**.
- Required: Nahi. Work ko GitHub latest main, Cloudflare deployment receipt, Lovable database, 72-slide blueprint aur current issue ledger se deduplicate karna hai. Earlier chat claims ko verified status se cross-check kare.
- Code/data: /dashboard, /login; profiles, attempts; src/lib/auth.tsx.
- Acceptance: T01,T06-T10,T48; see scenario matrix for actual evidence.

## Q011 — Kaise confirm hoga ki saare essential topics cover hue?

- SOURCE: Q&A, PDF p.7; status: **Missing**.
- Required: Blueprint ke 15 subject groups se subject->unit->topic->learning outcome coverage matrix banao. Har essential outcome ko reviewed lesson, retrieval question, case ya oral prompt se map karo; missing cells gap report mein dikhao.
- Code/data: /library, /lesson; subjects, lessons, content_sources, content_reviews.
- Acceptance: T11-T16,T42; see scenario matrix for actual evidence.

## Q012 — Kaun decide karega kaunsa topic essential hai?

- SOURCE: Q&A, PDF p.7; status: **Partial**.
- Required: DCI/National Dental Commission ke relevant BDS regulations, authorized textbooks, verified recruitment notices aur qualified dental faculty editorial review. Exam-weightage guess ko evidence na mano.
- Code/data: /library, /lesson; subjects, lessons, content_sources, content_reviews.
- Acceptance: T11-T16,T42; see scenario matrix for actual evidence.

## Q013 — Kya outdated medical information student ko sikh sakta hai?

- SOURCE: Q&A, PDF p.7; status: **Missing**.
- Required: Har clinical item ke source version, review date aur next-review due date record ho. Guideline change par flagged content temporarily pause ho aur approved correction ke baad publish ho.
- Code/data: /library, /lesson; subjects, lessons, content_sources, content_reviews.
- Acceptance: T11-T16,T42; see scenario matrix for actual evidence.

## Q014 — Kya AI khud clinical notes likh kar turant publish karega?

- SOURCE: Q&A, PDF p.7; status: **Blocked**.
- Required: Nahi. AI drafts create kar sakta hai, par clinical publication ke liye medical author + independent qualified reviewer + evidence sign-off + audit trail mandatory hai.
- Code/data: /library, /lesson; subjects, lessons, content_sources, content_reviews.
- Acceptance: T11-T16,T42; see scenario matrix for actual evidence.

## Q015 — Kya primary sources aur textbooks ke citations honge?

- SOURCE: Q&A, PDF p.7; status: **Missing**.
- Required: Haan. Each claim/lesson ke source title, edition/year, stable URL/identifier, relevant section, reviewed_on aur reviewer fields. Unsupported assertions ko source-needed status mile.
- Code/data: /library, /lesson; subjects, lessons, content_sources, content_reviews.
- Acceptance: T11-T16,T42; see scenario matrix for actual evidence.

## Q016 — Agar 2 trusted references disagree karein toh kya hoga?

- SOURCE: Q&A, PDF p.7; status: **Missing**.
- Required: Disputed status set karo, uncertainty explain karo, reviewer consensus record karo, aur ambiguous clinical MCQ ko publish na karo jab tak defensible single-best-answer aur scope clear na ho.
- Code/data: /library, /lesson; subjects, lessons, content_sources, content_reviews.
- Acceptance: T11-T16,T42; see scenario matrix for actual evidence.

## Q017 — Kya syllabus me 15 subjects ki equal importance hogi?

- SOURCE: Q&A, PDF p.7; status: **Partial**.
- Required: Coverage sabki hogi, lekin time allocation evidence-based baseline mastery, clinical importance aur official constraints se ho; invented exam weightage ke basis par false equal/unequal marks na dikhao. DentPrep | Independent education | Verified-source work handoff
- Code/data: /library, /lesson; subjects, lessons, content_sources, content_reviews.
- Acceptance: T11-T16,T42; see scenario matrix for actual evidence.

## Q018 — Kya diagrams/images scientifically sahi hongi?

- SOURCE: Q&A, PDF p.8; status: **Missing**.
- Required: Illustrations ke anatomical labels, orientation aur claims dental expert verify kare; alt text + usage rights record hon. Generated artwork ko illustration label aur source-approved clinical anatomy ke saath QA karo.
- Code/data: /library, /lesson; subjects, lessons, content_sources, content_reviews.
- Acceptance: T11-T16,T42; see scenario matrix for actual evidence.

## Q019 — Kya Hindi-medium ya weak-English student bhi samajh payega?

- SOURCE: Q&A, PDF p.8; status: **Missing**.
- Required: English exam-ready explanations with plain-English glossary, expandable Hindi/Hinglish help where feasible, progressively harder vocabulary and comprehension checks. Translation clinically reviewed ho.
- Code/data: /library, /lesson; subjects, lessons, content_sources, content_reviews.
- Acceptance: T11-T16,T42; see scenario matrix for actual evidence.

## Q020 — Kya app medicine prescribe karna sikha degi?

- SOURCE: Q&A, PDF p.8; status: **Blocked**.
- Required: App educational clinical reasoning sikhaye, patient-specific advice ya unsupervised treatment instructions nahi. Safety-sensitive drug doses/interventions ko expert approval, context aur supervision caveats ke bina surface na karo.
- Code/data: /library, /lesson; subjects, lessons, content_sources, content_reviews.
- Acceptance: T11-T16,T42; see scenario matrix for actual evidence.

## Q021 — Ek lesson ke end par kya student ko sach me samajh aaya ye check hoga?

- SOURCE: Q&A, PDF p.8; status: **Missing**.
- Required: Har lesson objective-based retrieval questions, 1-minute summary, applied mini-case aur confidence rating se check ho; sirf page open/read time ko mastery na samjho.
- Code/data: /library, /plan, /progress; topic_progress, revision_schedule.
- Acceptance: T14,T17-T20,T46; see scenario matrix for actual evidence.

## Q022 — Kya videos compulsory honge?

- SOURCE: Q&A, PDF p.8; status: **Partial**.
- Required: Nahi. Text, diagrams, guided examples, optional video/audio sab accessible modes ho sakte hain. Learning outcome test zaroori hai; video watch completion alone mastery ka proxy nahi.
- Code/data: /library, /plan, /progress; topic_progress, revision_schedule.
- Acceptance: T14,T17-T20,T46; see scenario matrix for actual evidence.

## Q023 — Kya basic se advanced order automatic hoga?

- SOURCE: Q&A, PDF p.8; status: **Missing**.
- Required: Prerequisite graph mein anatomy/physiology foundations se clinical application link karo. Baseline strong ho toh learner skip test de sakta hai; weak ho toh foundation remediation mile.
- Code/data: /library, /plan, /progress; topic_progress, revision_schedule.
- Acceptance: T14,T17-T20,T46; see scenario matrix for actual evidence.

## Q024 — Student ko galat concept samajh aaye toh?

- SOURCE: Q&A, PDF p.8; status: **Missing**.
- Required: Incorrect answer ke liye why-wrong explanation, misconception tag, concept recap aur new transfer question do. Sirf correct answer flash karke learning complete na mark karo.
- Code/data: /library, /plan, /progress; topic_progress, revision_schedule.
- Acceptance: T14,T17-T20,T46; see scenario matrix for actual evidence.

## Q025 — Har topic kitni baar revise hoga?

- SOURCE: Q&A, PDF p.8; status: **Partial**.
- Required: Adaptive spaced-review scheduling retrieval performance, difficulty aur forgetting patterns par based ho. Daily fixed count guarantee nahi; overdue items and estimated workload transparent rakho.
- Code/data: /library, /plan, /progress; topic_progress, revision_schedule.
- Acceptance: T14,T17-T20,T46; see scenario matrix for actual evidence.

## Q026 — Kya 7 din baad bhi yaad hai test hoga?

- SOURCE: Q&A, PDF p.8; status: **Missing**.
- Required: Yes: delayed retrieval checkpoints (e.g. next day, one week, one month) as configured, without exposing answers. Retention measure item-level first-attempt accuracy and transfer performance.
- Code/data: /library, /plan, /progress; topic_progress, revision_schedule.
- Acceptance: T14,T17-T20,T46; see scenario matrix for actual evidence.

## Q027 — Kya student ko baar-baar same question milne se fake accuracy aayegi?

- SOURCE: Q&A, PDF p.8; status: **Missing**.
- Required: Repeated-item accuracy separate dikhao, unseen question accuracy alag; spaced old questions and fresh transfer questions ka balance rakho. Suspicious exact repetition se inflated mastery avoid karo.
- Code/data: /library, /plan, /progress; topic_progress, revision_schedule.
- Acceptance: T14,T17-T20,T46; see scenario matrix for actual evidence.

## Q028 — Kya progress ka graph bas decoration hoga?

- SOURCE: Q&A, PDF p.8; status: **Missing**.
- Required: No. Date, actual submissions, attempted/correct counts, mastery tags, revisions and coverage evidence backed chart ho; zero data par honest empty state. DentPrep | Independent education | Verified-source work handoff
- Code/data: /library, /plan, /progress; topic_progress, revision_schedule.
- Acceptance: T14,T17-T20,T46; see scenario matrix for actual evidence.

## Q029 — Kya dyslexia/low-vision ya screen-reader students padh sakte hain?

- SOURCE: Q&A, PDF p.9; status: **Partial**.
- Required: WCAG 2.2 AA target, keyboard navigation, headings/labels, contrast, large text, reduced motion, readable tables, caption/alt text aur screen reader semantic announcements test karo.
- Code/data: /library, /plan, /progress; topic_progress, revision_schedule.
- Acceptance: T14,T17-T20,T46; see scenario matrix for actual evidence.

## Q030 — Kya daily teacher jaisa guidance milega?

- SOURCE: Q&A, PDF p.9; status: **Partial**.
- Required: Dashboard par Today next-best-action: continue lesson, review due, weak-topic drill, interview practice. Reason visible ho: e.g. last two unseen questions wrong, so repeat underlying concept.
- Code/data: /library, /plan, /progress; topic_progress, revision_schedule.
- Acceptance: T14,T17-T20,T46; see scenario matrix for actual evidence.

## Q031 — MCQs ke sahi answers kaun verify karega?

- SOURCE: Q&A, PDF p.9; status: **Blocked**.
- Required: Author drafts with single-best-answer rationale; at least one independent dental reviewer verifies stem, all options, answer, distractors, sources and clinical relevance before publish.
- Code/data: /practice, /attempt/:id, /saved; questions, test_answers, attempts.
- Acceptance: T21-T28; see scenario matrix for actual evidence.

## Q032 — Kya PYQs original UPSC questions honge?

- SOURCE: Q&A, PDF p.9; status: **Partial**.
- Required: Only if independently verifiable and legally usable with paper/year/source; otherwise label original DentPrep practice items. Never invent UPSC previous-year provenance.
- Code/data: /practice, /attempt/:id, /saved; questions, test_answers, attempts.
- Acceptance: T21-T28; see scenario matrix for actual evidence.

## Q033 — Kya MCQ mein 2 options sahi ho sakte hain?

- SOURCE: Q&A, PDF p.9; status: **Blocked**.
- Required: Ambiguity gate reject kare. Context-sensitive clinical items clarify assumptions, jurisdiction and wording; unresolved ambiguity -> withdraw/review, not force arbitrary correct choice.
- Code/data: /practice, /attempt/:id, /saved; questions, test_answers, attempts.
- Acceptance: T21-T28; see scenario matrix for actual evidence.

## Q034 — Kya option reveal test se pehle ho sakta hai?

- SOURCE: Q&A, PDF p.9; status: **Done (technical access gate)**.
- Required: Exam simulation mode me never; practice mode me answer save hone ke baad explanation optional. Browser/network replay se correctness prematurely leak na ho.
- Code/data: /practice, /attempt/:id, /saved; questions, test_answers, attempts.
- Acceptance: T21-T28; see scenario matrix for actual evidence.

Evidence: PR #18, deployed `98bf0db3f477c066adda862f31b8257ddf4c2937`; T25 SQL/REST/CI negative and reveal-stage tests. Reviewed clinical content is a separate blocked gate.

## Q035 — Kya random questions difficulty balanced rahenge?

- SOURCE: Q&A, PDF p.9; status: **Partial**.
- Required: Question blueprint by subject/topic/difficulty and review status; deterministic seeded test builds when needed. No published questions -> explicit empty state, never fill with draft content.
- Code/data: /practice, /attempt/:id, /saved; questions, test_answers, attempts.
- Acceptance: T21-T28; see scenario matrix for actual evidence.

## Q036 — Kya 10, 20, 30, 50 questions user choose kar sakta hai?

- SOURCE: Q&A, PDF p.9; status: **Partial**.
- Required: Configurable count with actual available approved pool; requested count > pool then show truthful actual count or disable start. No duplicated questions to match advertised quota.
- Code/data: /practice, /attempt/:id, /saved; questions, test_answers, attempts.
- Acceptance: T21-T28; see scenario matrix for actual evidence.

## Q037 — Timer khatam hone par kya hoga?

- SOURCE: Q&A, PDF p.9; status: **Partial**.
- Required: Server-authoritative attempt start/time limit, expiration handling, submission idempotency and clear final status; background tab/clock tampering should not produce silent score corruption.
- Code/data: /practice, /attempt/:id, /saved; questions, test_answers, attempts.
- Acceptance: T21-T28; see scenario matrix for actual evidence.

## Q038 — Skip, Previous, Next se answers lose honge?

- SOURCE: Q&A, PDF p.9; status: **Partial**.
- Required: Explicit saved/unsaved indicators; selected but unsaved state warning; navigation preserves saved state, retries idempotently. Test refresh, back, offline, connection drop.
- Code/data: /practice, /attempt/:id, /saved; questions, test_answers, attempts.
- Acceptance: T21-T28; see scenario matrix for actual evidence.

## Q039 — Score ka formula kya rahega?

- SOURCE: Q&A, PDF p.9; status: **Partial**.
- Required: Define raw correct, attempted, skipped and total separately. Accuracy = correct/attempted for attempted-only metric; score may be correct/total under DentPrep one-point scheme. Any official negative-marking is applied only if sourced. DentPrep | Independent education | Verified-source work handoff
- Code/data: /practice, /attempt/:id, /saved; questions, test_answers, attempts.
- Acceptance: T21-T28; see scenario matrix for actual evidence.

## Q040 — Wrong answer copy aur revise kaise hoga?

- SOURCE: Q&A, PDF p.10; status: **Partial**.
- Required: Wrong question auto enters private revision queue with topic and reason, links to reviewed lesson; revision repeats and tracks correction over time without rewriting historical original score.
- Code/data: /practice, /attempt/:id, /saved; questions, test_answers, attempts.
- Acceptance: T21-T28; see scenario matrix for actual evidence.

## Q041 — Accuracy percent 90 hone se mastery confirm ho jayegi?

- SOURCE: Q&A, PDF p.10; status: **Missing**.
- Required: Nahi. Confidence requires unseen questions, topic coverage, delayed retention, difficulty and sample size. Show accuracy with count and uncertainty; 9/10 is not same evidence as 90/100.
- Code/data: /progress; attempts, test_answers, revision_schedule.
- Acceptance: T18,T26-T28,T43; see scenario matrix for actual evidence.

## Q042 — Kya har subject ki accuracy alag dikhegi?

- SOURCE: Q&A, PDF p.10; status: **Partial**.
- Required: Haan, subject and topic breakdown based on own attempts, filtering reviewed unique items and showing sample counts. Insufficient data -> Not enough evidence.
- Code/data: /progress; attempts, test_answers, revision_schedule.
- Acceptance: T18,T26-T28,T43; see scenario matrix for actual evidence.

## Q043 — Kya wrong-answer details private rahenge?

- SOURCE: Q&A, PDF p.10; status: **Partial**.
- Required: Haan. Per-user access control, encrypted transport, limited retention, export/delete controls as implemented and a test that user A never sees B transcripts/results.
- Code/data: /progress; attempts, test_answers, revision_schedule.
- Acceptance: T18,T26-T28,T43; see scenario matrix for actual evidence.

## Q044 — Kya student khud confidence 100% mark kare toh app believe karegi?

- SOURCE: Q&A, PDF p.10; status: **Missing**.
- Required: Self-reported confidence separately track ho; mastery retrieval outcomes se validate ho. Confidence calibration gap highlight karo when high confidence and repeated errors coincide.
- Code/data: /progress; attempts, test_answers, revision_schedule.
- Acceptance: T18,T26-T28,T43; see scenario matrix for actual evidence.

## Q045 — Kya lesson read time ko progress maan sakte hain?

- SOURCE: Q&A, PDF p.10; status: **Partial**.
- Required: Engagement alag; mastery nahi. Video watched/read complete only completion indicator; concept mastery check after low-hint practice and delayed re-test.
- Code/data: /progress; attempts, test_answers, revision_schedule.
- Acceptance: T18,T26-T28,T43; see scenario matrix for actual evidence.

## Q046 — Kya accuracy tests mein cheat/answer memorization detect hoga?

- SOURCE: Q&A, PDF p.10; status: **Partial**.
- Required: Do not accuse users; recognize repeated identical items, unexpectedly fast responses and open-note modes. Separate practice accuracy from timed/unseen accuracy and label limitations.
- Code/data: /progress; attempts, test_answers, revision_schedule.
- Acceptance: T18,T26-T28,T43; see scenario matrix for actual evidence.

## Q047 — Kya AI explanations ko automatically correct samjha jayega?

- SOURCE: Q&A, PDF p.10; status: **Partial**.
- Required: Nahi. AI output is a candidate draft; grounded response with references and clinical safety boundaries. In conflict, prefer approved content and route uncertain answers to human review.
- Code/data: /progress; attempts, test_answers, revision_schedule.
- Acceptance: T18,T26-T28,T43; see scenario matrix for actual evidence.

## Q048 — Kaise pata chalega student exam-ready hai?

- SOURCE: Q&A, PDF p.10; status: **Missing**.
- Required: No deterministic pass predictor. Dashboard can show readiness indicators: breadth, unseen performance, retention, clinical reasoning, mock consistency; attach confidence/limitations and no UPSC selection probability.
- Code/data: /progress; attempts, test_answers, revision_schedule.
- Acceptance: T18,T26-T28,T43; see scenario matrix for actual evidence.

## Q049 — Kya learning analytics algorithms test honge?

- SOURCE: Q&A, PDF p.10; status: **Partial**.
- Required: Yes: formula unit tests, seed data, no-attempt states, time-zone IST, denominator edge cases, duplicate answers, revision invalidation and longitudinal regression tests.
- Code/data: /progress; attempts, test_answers, revision_schedule.
- Acceptance: T18,T26-T28,T43; see scenario matrix for actual evidence.

## Q050 — Kya student feedback se poor question ko flag kar sakta hai?

- SOURCE: Q&A, PDF p.10; status: **Missing**.
- Required: Yes: report a suspected error with item version, optional note, reviewer queue and resolution transparency. Valid disputes trigger regrading when fair and documented. DentPrep | Independent education | Verified-source work handoff
- Code/data: /progress; attempts, test_answers, revision_schedule.
- Acceptance: T18,T26-T28,T43; see scenario matrix for actual evidence.

## Q051 — 7-day aur 30-day plan ka matlab padhai bas itne din hai?

- Implementation: renewable-cycle/history/carry source and rollback SQL QA implemented; PR #21 CI/live/native expand-contract verified; actual account/device acceptance pending. No full adaptive/official-date behavior claimed.

- SOURCE: Q&A, PDF p.11; status: **Partial**.
- Required: Nahi. Ye renewable planning cycles hain; exam-date-unknown mode mein cycles indefinitely continue. Next cycle previous work and overdue tasks ko carry forward kare.
- Code/data: /plan; study_plans, study_tasks, profiles.
- Acceptance: T17-T20,T50; see scenario matrix for actual evidence.

## Q052 — Kya long-term syllabus roadmap dikhna chahiye?

- SOURCE: Q&A, PDF p.11; status: **Missing**.
- Required: Yes: foundation to clinical application to revision and interview, with coverage percent and projected workload—not a fabricated official deadline.
- Code/data: /plan; study_plans, study_tasks, profiles.
- Acceptance: T17-T20,T50; see scenario matrix for actual evidence.

## Q053 — Agar student 30 minute roz deta hai vs 4 hours?

- SOURCE: Q&A, PDF p.11; status: **Partial**.
- Required: Plan workload available study time, fatigue and current mastery ke hisaab se scale ho; unrealistic daily goals avoid karo and manual adjust allowed ho.
- Code/data: /plan; study_plans, study_tasks, profiles.
- Acceptance: T17-T20,T50; see scenario matrix for actual evidence.

## Q054 — Agar 10 din gap ho jaaye toh?

- Implementation: renewable-cycle/history/carry source and rollback SQL QA implemented; PR #21 CI/live/native expand-contract verified; actual account/device acceptance pending. No full adaptive/official-date behavior claimed.

- SOURCE: Q&A, PDF p.11; status: **Partial**.
- Required: No guilt/pop-up spam: missed tasks reschedule, prioritize due revisions, offer short restart plan; historical record remains unchanged.
- Code/data: /plan; study_plans, study_tasks, profiles.
- Acceptance: T17-T20,T50; see scenario matrix for actual evidence.

## Q055 — Kya exam date announce hone par automatic mode change hoga?

- SOURCE: Q&A, PDF p.11; status: **Missing**.
- Required: Only after official verified notification and ideally user confirmation; preserve existing progress and compute remaining days, prioritizing high-yield weak concepts without invented marking scheme.
- Code/data: /plan; study_plans, study_tasks, profiles.
- Acceptance: T17-T20,T50; see scenario matrix for actual evidence.

## Q056 — Kya interview practice shuru se chalegi?

- SOURCE: Q&A, PDF p.11; status: **Partial**.
- Required: Yes: clinical, English communication and public-service scenarios weekly parallel; exact intensity varies per baseline and future official selection stage.
- Code/data: /plan; study_plans, study_tasks, profiles.
- Acceptance: T17-T20,T50; see scenario matrix for actual evidence.

## Q057 — Kya plan automatic renew ho sakta hai?

- Implementation: renewable-cycle/history/carry source and rollback SQL QA implemented; PR #21 CI/live/native expand-contract verified; actual account/device acceptance pending. No full adaptive/official-date behavior claimed.

- SOURCE: Q&A, PDF p.11; status: **Partial**.
- Required: When cycle ends, create reviewed next cycle automatically or with user acceptance per settings. Never silently duplicate tasks or reset completed topics.
- Code/data: /plan; study_plans, study_tasks, profiles.
- Acceptance: T17-T20,T50; see scenario matrix for actual evidence.

## Q058 — Kya topic priority dynamic hogi?

- SOURCE: Q&A, PDF p.11; status: **Missing**.
- Required: Yes: unmet prerequisites, missed retention, risk-significant clinical topics, user goals and officially known constraints; provide explainable reason for recommendation.
- Code/data: /plan; study_plans, study_tasks, profiles.
- Acceptance: T17-T20,T50; see scenario matrix for actual evidence.

## Q059 — Kya late-night padhne par streak galat ho sakti hai?

- SOURCE: Q&A, PDF p.11; status: **Partial**.
- Required: Use user timezone or IST preference consistently; define study-day boundary; never count mere login as meaningful study without disclosed criteria.
- Code/data: /plan; study_plans, study_tasks, profiles.
- Acceptance: T17-T20,T50; see scenario matrix for actual evidence.

## Q060 — Kya data export ki suvidha hogi?

- SOURCE: Q&A, PDF p.11; status: **Missing**.
- Required: User may export plans, progress and question history where privacy-safe and allowed. Support deletion and explain what permanently persists, with no loss from ordinary app upgrades.
- Code/data: /plan; study_plans, study_tasks, profiles.
- Acceptance: T17-T20,T50; see scenario matrix for actual evidence.

## Q061 — Clinical case mein wrong treatment choose karne par kya hoga?

- SOURCE: Q&A, PDF p.12; status: **Missing**.
- Required: Educational corrective feedback should flag safety issue, red flags and appropriate escalation. Never encourage patient-specific unsupervised treatment.
- Code/data: /cases; clinical_cases, content_reviews.
- Acceptance: T29-T31,T42; see scenario matrix for actual evidence.

## Q062 — Emergency signs ko priority kaise milegi?

- SOURCE: Q&A, PDF p.12; status: **Missing**.
- Required: Red-flag-first decision tree verified by expert: airway compromise, major bleeding, sepsis concerns and urgent referral need identified in context, with no overconfident one-size-fits-all dosing.
- Code/data: /cases; clinical_cases, content_reviews.
- Acceptance: T29-T31,T42; see scenario matrix for actual evidence.

## Q063 — Kya cases actual patients ke records honge?

- SOURCE: Q&A, PDF p.12; status: **Partial**.
- Required: Use synthetic or de-identified cases with valid authorization and privacy protections. No identifiable patient stories in public fixtures or prompts.
- Code/data: /cases; clinical_cases, content_reviews.
- Acceptance: T29-T31,T42; see scenario matrix for actual evidence.

## Q064 — Kya clinical diagrams generated images se ban sakti hain?

- SOURCE: Q&A, PDF p.12; status: **Blocked**.
- Required: Possible if labelled as educational illustrations, but actual anatomy/diagnosis claims need independent specialist verification and permission/right-to-use review.
- Code/data: /cases; clinical_cases, content_reviews.
- Acceptance: T29-T31,T42; see scenario matrix for actual evidence.

## Q065 — Kya differential diagnosis sikhaya jayega?

- SOURCE: Q&A, PDF p.12; status: **Missing**.
- Required: Yes: ask evidence for/against each candidate diagnosis, needed investigations and uncertainty; avoid teaching mechanical guess as clinical certainty.
- Code/data: /cases; clinical_cases, content_reviews.
- Acceptance: T29-T31,T42; see scenario matrix for actual evidence.

## Q066 — Kya emergency clinical content doctor ke bina publish ho sakta hai?

- SOURCE: Q&A, PDF p.12; status: **Blocked**.
- Required: No. Safety-critical material requires qualified dental/medical reviewer sign-off; add high-severity block when source/rationale/reviewer missing.
- Code/data: /cases; clinical_cases, content_reviews.
- Acceptance: T29-T31,T42; see scenario matrix for actual evidence.

## Q067 — Agar AI medical recommendation unsafe de de toh?

- SOURCE: Q&A, PDF p.12; status: **Missing**.
- Required: Catch via risk policy and evaluation tests, cite approved safety sources, abstain/redirect, log review flag and withhold unsafe output; do not use prompt-only controls as sole defense.
- Code/data: /cases; clinical_cases, content_reviews.
- Acceptance: T29-T31,T42; see scenario matrix for actual evidence.

## Q068 — Kya case performance ko clinical competence certificate bana sakte hain?

- SOURCE: Q&A, PDF p.12; status: **Partial**.
- Required: No. Simulator is independent educational practice, not clinical licensure, eligibility, professional certification or proof of real-patient competence.
- Code/data: /cases; clinical_cases, content_reviews.
- Acceptance: T29-T31,T42; see scenario matrix for actual evidence.

## Q069 — Kya each case stage reviewed hoga?

- SOURCE: Q&A, PDF p.12; status: **Missing**.
- Required: Yes: case intro, red flags, reasoning steps, expected safe decisions, rationale, feedback and versions; per-stage reviewer sign-off and traceability.
- Code/data: /cases; clinical_cases, content_reviews.
- Acceptance: T29-T31,T42; see scenario matrix for actual evidence.

## Q070 — Kya old incorrect content silently change karna safe hai?

- SOURCE: Q&A, PDF p.12; status: **Missing**.
- Required: No. Version content, audit changes, record affected attempts, notify users if regrading needed. Preserve original attempt context for explainable score revisions.
- Code/data: /cases; clinical_cases, content_reviews.
- Acceptance: T29-T31,T42; see scenario matrix for actual evidence.

## Q071 — Kya abhi real AI interviewer live hai?

- SOURCE: Q&A, PDF p.12; status: **Partial**.
- Required: Current deployed baseline contains self-guided text and opt-in browser voice-to-text; do not call it fully adaptive conversational AI until a secured provider-backed integration is implemented and tested. DentPrep | Independent education | Verified-source work handoff
- Code/data: /interviews; interview_sessions, interview_feedback; browser-dictation.tsx.
- Acceptance: T32-T37; see scenario matrix for actual evidence.

## Q072 — Kya voice input dena compulsory hoga?

- SOURCE: Q&A, PDF p.13; status: **Partial**.
- Required: Nahi. Optional microphone consent, clear external-browser transcription disclosure, permission rejection fallback to text, and editable transcript before saving.
- Code/data: /interviews; interview_sessions, interview_feedback; browser-dictation.tsx.
- Acceptance: T32-T37; see scenario matrix for actual evidence.

## Q073 — Kya AI genuinely follow-up pooch sakta hai?

- SOURCE: Q&A, PDF p.13; status: **Missing**.
- Required: Future target yes, using authenticated server proxy, saved context and safe model configuration. It must never fabricate model capability or silently incur paid usage.
- Code/data: /interviews; interview_sessions, interview_feedback; browser-dictation.tsx.
- Acceptance: T32-T37; see scenario matrix for actual evidence.

## Q074 — Kya AI marks 92/100 deta toh usko reliable samjhein?

- SOURCE: Q&A, PDF p.13; status: **Missing**.
- Required: Not without calibrated rubric, multiple blinded human-rated anchors, inter-rater agreement and out-of-sample evaluation. Until then show descriptive feedback only, not pseudo-official scores.
- Code/data: /interviews; interview_sessions, interview_feedback; browser-dictation.tsx.
- Acceptance: T32-T37; see scenario matrix for actual evidence.

## Q075 — Clinical viva mein answers ki medical accuracy kaise check hogi?

- SOURCE: Q&A, PDF p.13; status: **Missing**.
- Required: Use reviewed evidence/golden cases, red-flag safety criteria and human expert evaluation of sampled outputs. AI can summarize gaps but cannot certify clinical correctness alone.
- Code/data: /interviews; interview_sessions, interview_feedback; browser-dictation.tsx.
- Acceptance: T32-T37; see scenario matrix for actual evidence.

## Q076 — Kya AI hamare student ka personal data use karega?

- SOURCE: Q&A, PDF p.13; status: **Missing**.
- Required: Use minimal necessary transcript, informed consent and privacy policy; do not send identifiers or clinical patient data. Provider retention and cross-border processing disclosures must be clear.
- Code/data: /interviews; interview_sessions, interview_feedback; browser-dictation.tsx.
- Acceptance: T32-T37; see scenario matrix for actual evidence.

## Q077 — Kya 5, 15 aur 30 min ke options actual timer honge?

- SOURCE: Q&A, PDF p.13; status: **Partial**.
- Required: When enabled, duration goal vs enforced timer must be distinguished. Existing self-guided goal cannot be called an official UPSC interview or guaranteed time-boxed live agent.
- Code/data: /interviews; interview_sessions, interview_feedback; browser-dictation.tsx.
- Acceptance: T32-T37; see scenario matrix for actual evidence.

## Q078 — Kya mixed Hindi-English speech supported rahegi?

- SOURCE: Q&A, PDF p.13; status: **Partial**.
- Required: Begin with en-IN where supported, disclose recognition errors, allow manual editing and fallback. Multilingual support should be tested with medical terminology on real devices.
- Code/data: /interviews; interview_sessions, interview_feedback; browser-dictation.tsx.
- Acceptance: T32-T37; see scenario matrix for actual evidence.

## Q079 — AI ka feedback har baar ek jaisa reliable hoga?

- SOURCE: Q&A, PDF p.13; status: **Missing**.
- Required: Require objective rubric, source references for factual critique, uncertainty, deterministic regression sets and human sampling; document model/version drift and known limits.
- Code/data: /interviews; interview_sessions, interview_feedback; browser-dictation.tsx.
- Acceptance: T32-T37; see scenario matrix for actual evidence.

## Q080 — Kya interview history private aur resumable rahegi?

- SOURCE: Q&A, PDF p.13; status: **Partial**.
- Required: Yes with per-user isolation, explicit Save Draft/Finish, transcript status and recoverable interrupted sessions. Test user A cannot load user B interviews.
- Code/data: /interviews; interview_sessions, interview_feedback; browser-dictation.tsx.
- Acceptance: T32-T37; see scenario matrix for actual evidence.

## Q081 — Kya slow mobile network par app chalegi?

- SOURCE: Q&A, PDF p.13; status: **Partial**.
- Required: Progressive loading, retry, offline reading where cached, low-byte assets and clear save status; measure 3G/4G flows and test no silent data loss.
- Code/data: auth.tsx, PWA, deployment scripts; all private tables.
- Acceptance: T05,T10,T38-T46; see scenario matrix for actual evidence.

## Q082 — Kya website ki har button sach me kaam karegi?

- SOURCE: Q&A, PDF p.13; status: **Partial**.
- Required: Clickable visual mock is not sufficient: each action needs route, state mutation, backend validation, keyboard behavior and Playwright screenshot/test evidence. DentPrep | Independent education | Verified-source work handoff
- Code/data: auth.tsx, PWA, deployment scripts; all private tables.
- Acceptance: T05,T10,T38-T46; see scenario matrix for actual evidence.

## Q083 — Kya student ka data app update par delete ho jayega?

- SOURCE: Q&A, PDF p.14; status: **Missing**.
- Required: It should not. Use schema migrations, backups and forward-compatible client states; test rollout, rollback and account persistence on real data-safe staging fixtures.
- Code/data: auth.tsx, PWA, deployment scripts; all private tables.
- Acceptance: T05,T10,T38-T46; see scenario matrix for actual evidence.

## Q084 — Kya password ya service-role keys browser mein jayengi?

- SOURCE: Q&A, PDF p.14; status: **Partial**.
- Required: Never. Only publishable backend key is client-safe; server secrets belong in protected environment and authorization decisions enforced server-side and by RLS.
- Code/data: auth.tsx, PWA, deployment scripts; all private tables.
- Acceptance: T05,T10,T38-T46; see scenario matrix for actual evidence.

## Q085 — Kya Supabase database Bite se mix ho sakta hai?

- SOURCE: Q&A, PDF p.14; status: **Partial**.
- Required: Never. Existing DentPrep Lovable/Supabase project remains separate from restaurant-os. Verify URLs/IDs in environment and guard against cross-project migrations.
- Code/data: auth.tsx, PWA, deployment scripts; all private tables.
- Acceptance: T05,T10,T38-T46; see scenario matrix for actual evidence.

## Q086 — Kya notification official UPSC announcement jaisa claim karegi?

- SOURCE: Q&A, PDF p.14; status: **Partial**.
- Required: Only based on verified official update and source URL, with timestamp. If not independently checked, label provisional/unverified and avoid push notification certainty.
- Code/data: auth.tsx, PWA, deployment scripts; all private tables.
- Acceptance: T05,T10,T38-T46; see scenario matrix for actual evidence.

## Q087 — Kya color contrast aur tap targets check honge?

- SOURCE: Q&A, PDF p.14; status: **Partial**.
- Required: Target WCAG 2.2 AA where applicable, test actual mobile touch size, keyboard/focus visibility, alt text, zoom and reduced motion.
- Code/data: auth.tsx, PWA, deployment scripts; all private tables.
- Acceptance: T05,T10,T38-T46; see scenario matrix for actual evidence.

## Q088 — Kya offline mode se expired medical note show ho sakta hai?

- SOURCE: Q&A, PDF p.14; status: **Missing**.
- Required: Mark offline cached version/date and validity; when online check update/revocation. Safety-critical withdrawn material should not be presented as current without warning.
- Code/data: auth.tsx, PWA, deployment scripts; all private tables.
- Acceptance: T05,T10,T38-T46; see scenario matrix for actual evidence.

## Q089 — Kya bugs aur errors ka evidence milega?

- SOURCE: Q&A, PDF p.14; status: **Partial**.
- Required: Yes: scenario ID, reproduction, device/browser, console/network trace, screenshot, severity, fix PR/commit, retest status, regression guard.
- Code/data: auth.tsx, PWA, deployment scripts; all private tables.
- Acceptance: T05,T10,T38-T46; see scenario matrix for actual evidence.

## Q090 — Kya analytics secretly track sensitive study/interview answers?

- SOURCE: Q&A, PDF p.14; status: **Missing**.
- Required: No. Prefer privacy-minimizing product telemetry, explicit notices, no raw transcript logging in analytics, role-restricted access, retention and deletion controls.
- Code/data: auth.tsx, PWA, deployment scripts; all private tables.
- Acceptance: T05,T10,T38-T46; see scenario matrix for actual evidence.

## Q091 — Kya 50 software scenarios enough hain?

- SOURCE: Q&A, PDF p.14; status: **Partial**.
- Required: They are minimum cross-functional acceptance; add dedicated medical content validation, learning outcome mastery tests, hallucination tests and actual longitudinal student pilots. No 50/50 Pass implies medically accurate teaching.
- Code/data: CI/release workflows, ops SQL, GitHub ledger.
- Acceptance: T41-T50; see scenario matrix for actual evidence.

## Q092 — Kya har test automated ho sakta hai?

- SOURCE: Q&A, PDF p.14; status: **Partial**.
- Required: No. Unit, integration and simulated browser tests automate much; clinical review, actual microphone, OAuth, Android APK, visual inspection and real learning retention need qualified humans/devices.
- Code/data: CI/release workflows, ops SQL, GitHub ledger.
- Acceptance: T41-T50; see scenario matrix for actual evidence.

## Q093 — Kya Pass likhna evidence ke bina chalega?

- SOURCE: Q&A, PDF p.14; status: **Partial**.
- Required: No. Each test gets steps, expected vs actual, environment, log/screenshot, branch/SHA and reviewer. Mark Blocked/Not Run if not executed. DentPrep | Independent education | Verified-source work handoff
- Code/data: CI/release workflows, ops SQL, GitHub ledger.
- Acceptance: T41-T50; see scenario matrix for actual evidence.

## Q094 — Kya 100 Q&A ke answers current app me already live hain?

- SOURCE: Q&A, PDF p.15; status: **Partial**.
- Required: No. This Q&A is a quality/implementation contract and gap checklist. Current code, database and tests must be audited before marking each item done.
- Code/data: CI/release workflows, ops SQL, GitHub ledger.
- Acceptance: T41-T50; see scenario matrix for actual evidence.

## Q095 — Kya medical expert review sign-off Work khud kar sakta hai?

- SOURCE: Q&A, PDF p.15; status: **Blocked**.
- Required: No. Work can build queue, check evidence and create draft; only appropriately qualified and authorized reviewer can perform accountable clinical approval.
- Code/data: CI/release workflows, ops SQL, GitHub ledger.
- Acceptance: T41-T50; see scenario matrix for actual evidence.

## Q096 — Kya naya feature directly main par push karna sahi hoga?

- SOURCE: Q&A, PDF p.15; status: **Partial**.
- Required: Use small PRs with typecheck, security scan, unit/integration tests, browser QA, safe merge and verified production rollout. Keep rollback/incident plan.
- Code/data: CI/release workflows, ops SQL, GitHub ledger.
- Acceptance: T41-T50; see scenario matrix for actual evidence.

## Q097 — Kya deployment green hone ka matlab student journey green?

- SOURCE: Q&A, PDF p.15; status: **Partial**.
- Required: No. Successful SSR/assets/PWA checks prove technical release only. Real login, saving, voice, mobile device and reviewed content learning must separately pass.
- Code/data: CI/release workflows, ops SQL, GitHub ledger.
- Acceptance: T41-T50; see scenario matrix for actual evidence.

## Q098 — Agar Work limit khatam ho jaye toh kya?

- SOURCE: Q&A, PDF p.15; status: **Partial**.
- Required: Persist DENTPREP_COMPLETION_LEDGER.md, 50-scenario matrix, PR links, exact SHA, blockers and next safe task in repository. Next session resume from verified state; no redo.
- Code/data: CI/release workflows, ops SQL, GitHub ledger.
- Acceptance: T41-T50; see scenario matrix for actual evidence.

## Q099 — Kya app kisi ko UPSC selection guarantee de?

- SOURCE: Q&A, PDF p.15; status: **Partial**.
- Required: No. No guarantee of selection, no official equivalence, no claimed readiness probability. Provide transparent educational progress, uncertainty and official source checking.
- Code/data: CI/release workflows, ops SQL, GitHub ledger.
- Acceptance: T41-T50; see scenario matrix for actual evidence.

## Q100 — Final 100% complete kaun decide karega?

- SOURCE: Q&A, PDF p.15; status: **Blocked**.
- Required: Definition of Done requires every blueprint workflow, content quality review, all critical 50 scenarios with proof, learning validation, real-device acceptance and trustworthy production release. Unmet external gates stay Blocked, never cosmetically 100%.
- Code/data: CI/release workflows, ops SQL, GitHub ledger.
- Acceptance: T41-T50; see scenario matrix for actual evidence.
