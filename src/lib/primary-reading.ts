/** Bibliographic reading directory only. No clinical explanations, answers or approval claims. */
export const FIRST_DENTAL_READING = {
  id: "ada-oral-cancer-2026",
  subject: "Oral Medicine & Radiology",
  subjectSlug: "oral-medicine-radiology",
  title: "Oral Cancer Guideline — 2026 chairside guide",
  publisher: "American Dental Association",
  edition: "Updated 31 August 2026",
  checkedOn: "24 November 2026",
  publisherUrl:
    "https://www.ada.org/resources/research/science/evidence-based-dental-research/oral-cancer-guideline/",
  guideUrl:
    "https://www.ada.org/-/media/project/ada-organization/ada/ada-org/files/resources/research/2026/ada_oral_cancer_guideline.pdf?hash=6BE7292DC9BF39D45886086D0E2E8920&rev=ab55e4fe0136415086f9b121c4536d30",
  readingSteps: [
    "Open the publisher's guide and check its version and intended audience.",
    "Read the introduction, definitions and section headings in the original source.",
    "Close the source, make a short note in your own words, then check it against the source.",
    "Keep any clinical interpretation questions for a qualified dental educator.",
  ],
} as const;


/** Original institutional reference pointer: not a DentPrep approved clinical lesson. */
export const SECOND_DENTAL_READING = {
  id: "sdcep-anticoagulants-2022",
  subject: "Oral & Maxillofacial Surgery",
  subjectSlug: "oral-maxillofacial-surgery",
  title: "Dental Patients Taking Anticoagulants — professional guide",
  publisher: "Scottish Dental Clinical Effectiveness Programme (SDCEP)",
  edition: "Second edition (2022)",
  checkedOn: "24 November 2026",
  publisherUrl:
    "https://companion.sdcep.org.uk/management-of-dental-patients-taking-anticoagulants-or-antiplatelet-drugs/introduction/about-this-guidance/",
  guideUrl:
    "https://companion.sdcep.org.uk/management-of-dental-patients-taking-anticoagulants-or-antiplatelet-drugs/",
  readingSteps: [
    "Confirm the publisher, edition, intended professional audience and Scottish/UK context.",
    "Find the separate source sections for VKAs, DOACs, antiplatelets and combination therapies.",
    "Note what patient and procedure details are needed before interpreting the guidance, without making a treatment decision.",
    "List questions to verify with a qualified Indian dental educator before applying any clinical advice.",
  ],
} as const;
