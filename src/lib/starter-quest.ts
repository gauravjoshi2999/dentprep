
/** Original, nonclinical study-skills warm-up. Does not imply BDS or UPSC mastery. */
export type StarterUnit = {
  id: string;
  title: string;
  lesson: string;
  question: string;
  choices: readonly [string, string, string];
  answer: 0 | 1 | 2;
  hint: string;
  explanation: string;
  citation: string;
  href: string;
};
export const STARTER_UNITS: readonly StarterUnit[] = [
  {
    id: "recall", title: "Active recall",
    lesson: "After reading a definition, close the notes and try to explain it without looking. Then reopen your source to correct gaps. This is retrieval practice, not just rereading.",
    question: "Which action best checks whether you can retrieve what you studied?",
    choices: ["Highlight every sentence", "Explain it without looking at your notes", "Read it again while looking at the answer"],
    answer: 1,
    hint: "Choose the option that requires remembering without reading.",
    explanation: "Attempting retrieval is valuable practice, and checking the source afterward helps correct gaps.",
    citation: "Dunlosky et al. (2013), evidence review", href: "https://pubmed.ncbi.nlm.nih.gov/26173288/",
  },
  {
    id: "spacing", title: "Spaced revision",
    lesson: "Review a concept over separate sessions instead of putting all practice into one sitting. Your 7, 15 and 30-day DentPrep plans are renewable cycles, not the end of preparation.",
    question: "Which plan uses distributed practice?",
    choices: ["Revise briefly today and again over later days", "Read the topic only once", "Wait for an unconfirmed exam date before revising"],
    answer: 0,
    hint: "Consider what happens across different days.",
    explanation: "Spreading retrieval and study across sessions is supported by research on durable learning.",
    citation: "Dunlosky et al. (2013), distributed practice", href: "https://pubmed.ncbi.nlm.nih.gov/26173288/",
  },
  {
    id: "medical-review", title: "Trust reviewed sources",
    lesson: "DentPrep keeps unreviewed clinical lessons, questions and cases in draft. A convincing AI answer is not qualified medical approval; clinical content needs appropriate sourced independent expert review.",
    question: "You find a dental lesson labelled DRAFT without independent medical approval. What should you do?",
    choices: ["Treat it as approved because an app displayed it", "Use it as a final clinical answer", "Wait for approval and consult trusted references or a qualified educator"],
    answer: 2,
    hint: "Draft is a preparation status, not a medical certification.",
    explanation: "Only appropriately reviewed clinical material should enter DentPrep's teaching path. Source notes and approval status must be checked.",
    citation: "DentPrep medical safety specification, Issue #27", href: "https://github.com/gauravjoshi2999/dentprep/issues/27",
  },
  {
    id: "upsc", title: "Verify exam announcements",
    lesson: "DentPrep is an independent preparation app. A social post or guess is not an official UPSC exam announcement. Continue studying even while an official examination date is unknown.",
    question: "Where should you verify a claimed UPSC recruitment or exam notice?",
    choices: ["A random forwarded screenshot", "UPSC's official website and published notices", "An unsupported countdown in a study app"],
    answer: 1,
    hint: "Who actually issues authoritative recruitment notices?",
    explanation: "Check the official UPSC website and subsequent corrigenda. Do not treat practice schedules as confirmed exam dates.",
    citation: "Union Public Service Commission, official portal", href: "https://upsc.gov.in/",
  },
];
export function starterCorrect(unit: StarterUnit, selected: number | null): boolean {
  return selected !== null && Number.isInteger(selected) && selected >= 0 && selected < 3 && selected === unit.answer;
}
export function starterCatalogErrors(units: readonly StarterUnit[]): string[] {
  const ids = new Set<string>(), errors: string[] = [];
  for (const unit of units) {
    if (ids.has(unit.id) || !unit.id) errors.push("Duplicate or empty ID");
    ids.add(unit.id);
    if (unit.choices.length !== 3 || unit.choices.some((x) => !x.trim())) errors.push("Invalid choices");
    if (![0,1,2].includes(unit.answer)) errors.push("Invalid answer index");
    if (!/^https:\/\/[^ ]+$/.test(unit.href) || !unit.citation.trim()) errors.push("Missing evidence");
    if (!unit.lesson.trim() || !unit.question.trim() || !unit.hint.trim() || !unit.explanation.trim()) errors.push("Incomplete explanation");
  }
  return errors;
}
