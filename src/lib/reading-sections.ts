/** Bibliographic navigation only. No DentPrep clinical summary, answer key or approval. */
export type ReadingSection = {
  sourceId: string;
  title: string;
  publisher: string;
  locator: string;
  edition: string;
  context: string;
  url: string;
};

const companion =
  "https://companion.sdcep.org.uk/management-of-dental-patients-taking-anticoagulants-or-antiplatelet-drugs/";
const acute = "https://www.acutedentalproblems.sdcep.org.uk/";
export const READING_SECTIONS: Readonly<Record<string, readonly ReadingSection[]>> = {
  "sdcep-anticoagulants-2022": [
    {
      sourceId: "IDA-ASSESSMENT",
      title: "Assessment, consent and ongoing care",
      publisher: "Indian Dental Association",
      locator: "For Patient Management — Standards 9, 10 and 12",
      edition: "Webpage; publication year not displayed",
      context: "India · accreditation standards",
      url: "https://www.ida.org.in/Accreditation/Details/ForPatientManagement",
    },
    {
      sourceId: "SDCEP-RISK",
      title: "Assessing bleeding risk",
      publisher: "SDCEP",
      locator: "Section 3 — Clinical practice advice",
      edition: "Second edition, 2022",
      context: "UK · professional guidance",
      url: `${companion}assessing-bleeding-risk/clinical-practice-advice/`,
    },
    {
      sourceId: "SDCEP-VKA",
      title: "Warfarin and other vitamin K antagonists",
      publisher: "SDCEP",
      locator: "Section 6 — Recommendation and clinical practice advice",
      edition: "Second edition, 2022",
      context: "UK · professional guidance",
      url: `${companion}treatment-recommendations/warfarin-or-another-vitamin-k-antagonist/`,
    },
    {
      sourceId: "SDCEP-DOAC",
      title: "Direct oral anticoagulants",
      publisher: "SDCEP",
      locator: "Section 5 — Recommendations; Monitoring",
      edition: "Second edition, 2022",
      context: "UK · professional guidance",
      url: `${companion}treatment-recommendations/direct-oral-anticoagulants-doacs/recommendations/`,
    },
    {
      sourceId: "SDCEP-BLEEDING",
      title: "Post-extraction haemorrhage",
      publisher: "SDCEP",
      locator: "Common oral conditions — Initial management; Subsequent care",
      edition: "Second edition, March 2026",
      context: "UK · acute dental problems",
      url: `${acute}guidance/management-of-oral-conditions/common-oral-conditions/post-extraction-haemorrhage/`,
    },
    {
      sourceId: "SDCEP-TRIAGE",
      title: "Prioritising dental emergencies",
      publisher: "SDCEP",
      locator: "Dental Practice Guide — Accessible version",
      edition: "Supporting practice guide added September 2026",
      context: "UK · practice setting",
      url: `${acute}supporting-tools/dental-practice-guide/prioritising-dental-emergencies/accessible-version/`,
    },
  ],
};
