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


/** Official infection-prevention reference; not reviewed DentPrep clinical teaching. */
export const THIRD_DENTAL_READING = {
  id: "cdc-dental-infection-prevention",
  subject: "Public Health Dentistry",
  subjectSlug: "public-health-dentistry",
  title: "Infection Prevention Practices in Dental Settings",
  publisher: "US Centers for Disease Control and Prevention (CDC)",
  edition: "CDC summary and linked current infection-control recommendations",
  checkedOn: "24 November 2026",
  publisherUrl: "https://www.cdc.gov/dental-infection-control/hcp/index.html",
  guideUrl: "https://www.cdc.gov/dental-infection-control/hcp/summary/index.html",
  readingSteps: [
    "Identify the publisher, intended US dental care setting and summary publication details.",
    "Locate CDC sections on standard precautions, hand hygiene and instrument processing.",
    "Write a short recall note distinguishing source recommendations from local Indian standards.",
    "Mark any care-protocol questions for faculty review rather than treating this reading as clinical certification.",
  ],
} as const;

/** Official professional endodontic resource directory; not an approved DentPrep lesson. */
export const FOURTH_DENTAL_READING = {
  id: "aae-endodontic-resources",
  subject: "Conservative Dentistry & Endodontics",
  subjectSlug: "conservative-endodontics",
  title: "Endodontic Clinical Resources — guidelines and terminology",
  publisher: "American Association of Endodontists (AAE)",
  edition: "Living clinical resource index; verify dates of individual linked guidance",
  checkedOn: "24 November 2026",
  publisherUrl: "https://www.aae.org/specialty/clinical-resources/",
  guideUrl: "https://www.aae.org/specialty/clinical-resources/guidelines-position-statements/",
  readingSteps: [
    "Confirm which AAE guidance or terminology resource you opened and record its date.",
    "Locate relevant sections on pulpal and periapical terminology or treatment-planning resources.",
    "Separate definitions and examination learning from patient-specific diagnosis or treatment advice.",
    "List uncertain claims for an appropriately qualified Indian dental faculty review.",
  ],
} as const;

/** European professional guideline directory; not Indian clinical protocol or reviewed lesson. */
export const FIFTH_DENTAL_READING = {
  id: "efp-periodontitis-guidelines",
  subject: "Periodontology",
  subjectSlug: "periodontology",
  title: "Clinical guidelines — periodontitis stages I–III",
  publisher: "European Federation of Periodontology (EFP)",
  edition: "EFP stage I–III guideline (2020); newer guideline topics also listed",
  checkedOn: "24 November 2026",
  publisherUrl: "https://www.efp.org/education/continuing-education/clinical-guidelines/",
  guideUrl: "https://www.efp.org/education/continuing-education/clinical-guidelines/",
  readingSteps: [
    "Review the EFP index and distinguish stage I–III, stage IV and peri-implant guidelines.",
    "Identify the date and scope of the particular EFP recommendation before noting it.",
    "Create a recall note on how guideline scope differs from a complete BDS syllabus.",
    "Ask qualified local faculty to verify clinical decisions and India-specific applicability.",
  ],
} as const;


/** ACP prosthodontic specialty reference index; not a clinical teaching approval. */
export const SIXTH_DENTAL_READING = {
  id: "acp-prosthodontic-care",
  subject: "Prosthodontics",
  subjectSlug: "prosthodontics",
  title: "Parameters of Care — Prosthodontic Diagnostic Index",
  publisher: "American College of Prosthodontists (ACP)",
  edition: "Publisher lists Parameters of Care (2020) and diagnostic-index materials",
  checkedOn: "24 November 2026",
  publisherUrl: "https://www.prosthodontics.org/acp-publications/parameters-of-care/",
  guideUrl: "https://www.prosthodontics.org/acp-publications/parameters-of-care/",
  readingSteps: [
    "Open the ACP publication index and identify its 2020 parameters document.",
    "Locate the categories for complete dentate, partial edentulism and complete edentulism.",
    "Record the intended prosthodontic-specialty audience and scope of the diagnostic index.",
    "Ask relevant faculty to reconcile case classification and Indian care context before making treatment decisions.",
  ],
} as const;
