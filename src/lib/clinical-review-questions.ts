/** Guided source-review questions. These do NOT review any unpublished DentPrep lesson. */
export type ReviewAnswer = "ok" | "change" | "evidence" | "not_applicable";

export type ReviewQuestion = {
  id: string;
  section: "Source & scope" | "Clinical safety" | "Teaching readiness" | "Subject-specific check";
  question: string;
  guidance: string;
};

const COMMON: ReviewQuestion[] = [
  {
    id: "source-version", section: "Source & scope",
    question: "क्या original publisher, guideline का वर्ष/edition और update date सही हैं?",
    guidance: "Source में exact version और जिस section पर भरोसा है उसे जाँचें।",
  },
  {
    id: "scope", section: "Source & scope",
    question: "क्या source किन मरीजों/उम्र/clinical setting के लिए है, यह स्पष्ट है?",
    guidance: "UK/US guidelines को भारत का नियम या UPSC syllabus न मानें।",
  },
  {
    id: "claim-evidence", section: "Source & scope",
    question: "क्या मुख्य clinical claims के लिए सही section, page या evidence मौजूद है?",
    guidance: "जो claim verify नहीं हुआ, उसकी exact line/section comment में लिखें।",
  },
  {
    id: "conflicts", section: "Clinical safety",
    question: "क्या outdated, conflicting या गलत समझे जा सकने वाले निष्कर्ष पहचाने गए हैं?",
    guidance: "अगर संदिग्ध दावा मिले तो source और कारण बताइए।",
  },
  {
    id: "red-flags", section: "Clinical safety",
    question: "क्या emergencies, red flags, referral और specialist escalation सही पहचाने गए हैं?",
    guidance: "अगर यह स्रोत इस विषय पर नहीं है, Not applicable चुनकर कारण दें।",
  },
  {
    id: "drug-safety", section: "Clinical safety",
    question: "क्या medicine/dose, contraindications, bleeding या drug-interaction संबंधी जोखिम सही हैं?",
    guidance: "Non-drug topics में Not applicable चुनें; कोई patient-specific prescription न लिखें।",
  },
  {
    id: "procedures", section: "Clinical safety",
    question: "क्या procedures, complications, consent और BDS-vs-specialist boundaries स्पष्ट हैं?",
    guidance: "यह guideline reading है, practical procedure की अनुमति नहीं।",
  },
  {
    id: "student-clarity", section: "Teaching readiness",
    question: "क्या इस source से पढ़ने वाले छात्र के लिए अहम definitions और सीखने की सीमा स्पष्ट हैं?",
    guidance: "कौन-से concepts future DentPrep lesson में शामिल/सुधारने चाहिए?",
  },
  {
    id: "questions-cases", section: "Teaching readiness",
    question: "क्या future MCQ, answer rationale और clinical cases के लिए कोई ambiguity/unsafe shortcut है?",
    guidance: "यह source review है; unpublished DentPrep questions अभी आपके सामने नहीं हैं।",
  },
  {
    id: "missing-topics", section: "Teaching readiness",
    question: "क्या कोई जरूरी topic, patient group या source locator छूट रहा है?",
    guidance: "जो छूटा है उसे 'सुधार जरूरी' चुनकर बताएं; सभी topics cover हैं ऐसा न मानें।",
  },
];

const SPECIAL: Record<string, [ReviewQuestion, ReviewQuestion]> = {
  "ada-oral-cancer-2026": [
    { id: "lesion-diagnosis", section: "Subject-specific check", question: "क्या lesion examination, diagnostic uncertainty, biopsy और referral की सीमाएँ ठीक हैं?", guidance: "Visual exam को definitive histological diagnosis न मानें।" },
    { id: "referral-timing", section: "Subject-specific check", question: "क्या follow-up/referral timing को सही population, source और देश के संदर्भ में पढ़ा गया है?", guidance: "ADA और UK NICE के समय-नियम बिना समीक्षा एक न बनाएं।" },
  ],
  "sdcep-anticoagulants-2022": [
    { id: "anticoagulant-types", section: "Subject-specific check", question: "क्या VKA, DOAC, antiplatelet और combination therapy अलग-अलग समझी गई हैं?", guidance: "INR सभी drugs के लिए उपयुक्त नहीं होता; exact guideline देखें।" },
    { id: "bleeding-handover", section: "Subject-specific check", question: "क्या bleeding-risk assessment, local haemostasis और referral boundaries स्पष्ट हैं?", guidance: "Scottish guideline को बिना India-context review लागू न करें।" },
  ],
  "cdc-dental-infection-prevention": [
    { id: "ppe-reprocessing", section: "Subject-specific check", question: "क्या standard precautions, PPE और instrument reprocessing की sections सही पहचानी गई हैं?", guidance: "Sterilization और disinfection के अंतर पर ध्यान दें।" },
    { id: "infection-local", section: "Subject-specific check", question: "क्या US CDC recommendations और भारतीय clinic rules के अंतर साफ हैं?", guidance: "Local policies की जरूरत हो तो review note में लिखें।" },
  ],
  "aae-endodontic-resources": [
    { id: "pulpal-periapical", section: "Subject-specific check", question: "क्या pulpal/periapical diagnosis की terminology और diagnostic limitations सही हैं?", guidance: "Clinical tests और radiographic interpretation को context में जाँचें।" },
    { id: "endo-emergencies", section: "Subject-specific check", question: "क्या urgent referral और endodontic procedural boundaries अलग रखी गई हैं?", guidance: "कौन-सा मामला specialist judgement माँगता है, नोट करें।" },
  ],
  "efp-periodontitis-guidelines": [
    { id: "staging-grading", section: "Subject-specific check", question: "क्या periodontitis staging/grading और guideline population का संदर्भ सही है?", guidance: "Stage I–III और Stage IV को एक ही protocol न मानें।" },
    { id: "risk-maintenance", section: "Subject-specific check", question: "क्या risk factors, outcomes और supportive periodontal care की सीमा सही है?", guidance: "स्थानीय clinical decisions प्रशिक्षित dentist लेगा।" },
  ],
  "acp-prosthodontic-care": [
    { id: "diagnostic-index", section: "Subject-specific check", question: "क्या prosthodontic diagnostic-index categories सही अलग की गई हैं?", guidance: "Complete और partial edentulism में भेद जाँचें।" },
    { id: "complexity-consent", section: "Subject-specific check", question: "क्या case complexity, referral और patient consent की सीमाएँ साफ हैं?", guidance: "Diagnostic index को treatment authorization न मानें।" },
  ],
  "aapd-pediatric-reference-2026": [
    { id: "age-child", section: "Subject-specific check", question: "क्या child age group, developmental stage और pediatric-specific precautions सही हैं?", guidance: "Adult recommendations बच्चों पर सीधे लागू न करें।" },
    { id: "pediatric-medication", section: "Subject-specific check", question: "क्या dose/sedation, consent और safeguarding जैसे risks के लिए सही संदर्भ हैं?", guidance: "किसी बच्चे के लिए prescription/dose न लिखें।" },
  ],
  "bos-orthodontic-guidelines": [
    { id: "ortho-records", section: "Subject-specific check", question: "क्या records, consent, retention और follow-up के source sections सही हैं?", guidance: "Specific BOS document/edition की जाँच करें।" },
    { id: "ortho-referral", section: "Subject-specific check", question: "क्या case-selection, referral और orthodontic treatment boundaries उचित हैं?", guidance: "UK society guidance को भारतीय कानून न बताएं।" },
  ],
};

export const REVIEW_CHOICES: { id: ReviewAnswer; label: string }[] = [
  { id: "ok", label: "ठीक है" },
  { id: "change", label: "सुधार जरूरी" },
  { id: "evidence", label: "प्रमाण स्पष्ट नहीं" },
  { id: "not_applicable", label: "लागू नहीं" },
];

export function reviewQuestions(sourceId: string): ReviewQuestion[] {
  const special = SPECIAL[sourceId];
  return special ? [...COMMON, ...special] : [...COMMON];
}

export function serializeGuidedReview(
  sourceTitle: string,
  sourceEdition: string,
  sectionLocator: string,
  questions: ReviewQuestion[],
  answers: Record<string, { answer: ReviewAnswer; note: string }>,
  finalComment: string,
): string {
  const lines = [
    "REVIEW SCOPE: PUBLISHER SOURCE READING ONLY — NOT A DENTPREP LESSON, MCQ OR CASE SIGN-OFF",
    `Original reference: ${sourceTitle}; edition: ${sourceEdition}`,
    `Reviewed exact page/section: ${sectionLocator.trim()}`,
    ...questions.map((question, i) => {
      const a = answers[question.id];
      return `Q${i + 1} [${question.id}] ${question.question} => ${a.answer.toUpperCase()}${a.note.trim() ? `; Comment: ${a.note.trim()}` : ""}`;
    }),
    `Final corrections / missing topics: ${finalComment.trim() || "None reported for this reference reading."}`,
    "The submitted statements are self-reported, pending verification, not clinical approval.",
  ];
  return lines.join("\n");
}
