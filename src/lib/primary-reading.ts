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


/** AAPD 2026–27 publisher directory, not a dental or Indian practice certification. */
export const SEVENTH_DENTAL_READING = {
  id: "aapd-pediatric-reference-2026",
  subject: "Pediatric Dentistry",
  subjectSlug: "pediatric-dentistry",
  title: "Reference Manual of Pediatric Dentistry — 2026–27",
  publisher: "American Academy of Pediatric Dentistry (AAPD)",
  edition: "2026–27 publisher's current index; each document has its own revision date",
  checkedOn: "24 November 2026",
  publisherUrl: "https://www.aapd.org/research/oral-health-policies--recommendations/",
  guideUrl: "https://www.aapd.org/research/oral-health-policies--recommendations/",
  readingSteps: [
    "Identify the current AAPD reference-manual year, document audience and publisher.",
    "Find the headings for best practices, oral health policies and clinical practice guidelines.",
    "Choose one age-appropriate topic and note the specific document's last revision date.",
    "Discuss clinical interpretation, dosing and India-specific practice context with qualified pediatric dental faculty.",
  ],
} as const;


/** BOS guidance index is UK professional source reading, not reviewed DentPrep clinical teaching. */
export const EIGHTH_DENTAL_READING = {
  id: "bos-orthodontic-guidelines",
  subject: "Orthodontics",
  subjectSlug: "orthodontics",
  title: "Advice Sheets and Orthodontic Clinical Guidelines",
  publisher: "British Orthodontic Society (BOS)",
  edition: "Living guidance index; document-specific revision dates vary (2025–26 and earlier)",
  checkedOn: "24 November 2026",
  publisherUrl: "https://bos.org.uk/professionals-members/advice-sheets-and-guidelines/",
  guideUrl: "https://bos.org.uk/professionals-members/advice-sheets-and-guidelines/",
  readingSteps: [
    "Confirm the British Orthodontic Society as publisher and note each document's revision date.",
    "Locate the index entries on orthodontic records, consent and retention.",
    "Explain why this UK professional guidance does not define an official Indian exam syllabus.",
    "Write any patient-management question for a qualified local orthodontic educator to review.",
  ],
} as const;

/** WHO/IARC taxonomy directory; published taxonomy is not a DentPrep clinical lesson. */
export const NINTH_DENTAL_READING = {
  id: "iarc-head-neck-2024",
  subject: "Oral Pathology",
  subjectSlug: "oral-pathology",
  title: "WHO Classification of Tumours — Head and Neck Tumours",
  publisher: "WHO / International Agency for Research on Cancer (IARC)",
  edition: "WHO Classification of Tumours, 5th edition, Volume 9 (2024); online index",
  checkedOn: "24 November 2026",
  publisherUrl: "https://publications.iarc.who.int/Book-And-Report-Series/Who-Classification-Of-Tumours/Head-And-Neck-Tumours-2024",
  guideUrl: "https://whobluebooks.iarc.who.int/structures/head-and-neck-tumours/",
  readingSteps: [
    "Find the oral cavity and mobile tongue section in the original IARC taxonomy.",
    "Distinguish a classification heading from a diagnostic finding or teaching recommendation.",
    "Record source edition, selected entity name and available references.",
    "Ask oral pathology faculty to confirm any application to BDS teaching or a patient scenario.",
  ],
} as const;

/** NMC medical curriculum reference; not a BDS-specific clinical protocol. */
export const TENTH_DENTAL_READING = {
  id: "nmc-cbme-2024",
  subject: "General Medicine & Surgery",
  subjectSlug: "general-medicine-surgery",
  title: "Competency Based Medical Education Curriculum",
  publisher: "National Medical Commission (India)",
  edition: "NMC CBME Curriculum 2024; MBBS curriculum, not UPSC BDS exam syllabus",
  checkedOn: "24 November 2026",
  publisherUrl: "https://nmc.org.in/page/rules-regulations-rules-regulations-nmc",
  guideUrl: "https://www.nmc.org.in/wp-content/uploads/2026/02/12bCompetencyBasedMedicalEducationCBMECurriculum12092024.pdf",
  readingSteps: [
    "Confirm this is an NMC medical, not DCI dental, curriculum.",
    "Find medicine and surgery competency headings and record exact sections.",
    "Create a glossary of systemic-health topics without adopting clinical treatment protocols.",
    "Cross-map BDS relevance with a current dental curriculum and faculty.",
  ],
} as const;

/** Indian dental curriculum source; not a pharmacology prescription reference. */
export const ELEVENTH_DENTAL_READING = {
  id: "dci-bds-pharm-materials",
  subject: "Pharmacology & Dental Materials",
  subjectSlug: "pharmacology-dental-materials",
  title: "Revised BDS Course Regulations — Pharmacology & Dental Materials",
  publisher: "National Dental Commission / legacy Dental Council of India",
  edition: "Revised BDS Course Regulations 2007 with amendments; verify current applicability",
  checkedOn: "24 November 2026",
  publisherUrl: "https://dciindia.gov.in/GazetteList.aspx",
  guideUrl: "https://dciindia.gov.in/Rule_Regulation/Revised_BDS_Course_Regulation_2007.pdf",
  readingSteps: [
    "Locate General and Dental Pharmacology and Dental Materials under study syllabi.",
    "Prepare a chapter-index revision list with class names, not drug doses.",
    "Use a current authoritative medicines reference before assessing safety or interactions.",
    "Flag updated law, guidance and textbook-edition gaps for a qualified reviewer.",
  ],
} as const;

/** Indian undergraduate dental foundation syllabus; not a clinical treatment source. */
export const TWELFTH_DENTAL_READING = {
  id: "dci-bds-foundations",
  subject: "Basic Medical Sciences",
  subjectSlug: "basic-medical-sciences",
  title: "Revised BDS Course Regulations — Foundational Sciences",
  publisher: "National Dental Commission / legacy Dental Council of India",
  edition: "Revised BDS Course Regulations 2007 with amendments; verify current applicability",
  checkedOn: "24 November 2026",
  publisherUrl: "https://dciindia.gov.in/GazetteList.aspx",
  guideUrl: "https://dciindia.gov.in/Rule_Regulation/Revised_BDS_Course_Regulation_2007.pdf",
  readingSteps: [
    "Find anatomy, physiology, biochemistry and microbiology in the official course outline.",
    "Make a simple topic-to-textbook chapter map.",
    "Review foundational definitions before clinical extrapolation.",
    "Confirm the latest applicable curriculum and qualification scope with faculty.",
  ],
} as const;

/** WHO/ICRC first-contact care learning resource, not a dental-chair emergency protocol. */
export const THIRTEENTH_DENTAL_READING = {
  id: "who-basic-emergency-care",
  subject: "Medical Emergencies",
  subjectSlug: "medical-emergencies",
  title: "Basic Emergency Care — WHO/ICRC course",
  publisher: "World Health Organization (WHO), ICRC and IFEM",
  edition: "WHO Basic Emergency Care programme; review individual module updates",
  checkedOn: "24 November 2026",
  publisherUrl: "https://www.who.int/teams/integrated-health-services/clinical-services-and-systems/emergency-and-critical-care/bec",
  guideUrl: "https://www.who.int/publications/i/item/basic-emergency-care-approach-to-the-acutely-ill-and-injured",
  readingSteps: [
    "Confirm the target audience and setting for WHO Basic Emergency Care.",
    "Identify the headings for approach, assessment, handover and escalation.",
    "Record concepts for faculty-led practice, not self-directed clinical intervention.",
    "Verify local emergency pathways, scope of practice and current clinical procedures separately.",
  ],
} as const;

/** Indian professional ethics regulation; check newer amendments/current national rules. */
export const FOURTEENTH_DENTAL_READING = {
  id: "dci-dentists-ethics-2014",
  subject: "Infection Control & Ethics",
  subjectSlug: "infection-control-ethics",
  title: "Revised Dentists (Code of Ethics) Regulations",
  publisher: "National Dental Commission / legacy Dental Council of India",
  edition: "2014 ethics regulations; verify any successor or amended requirements",
  checkedOn: "24 November 2026",
  publisherUrl: "https://dciindia.gov.in/GazetteList.aspx",
  guideUrl: "https://dciindia.gov.in/Rule_Regulation/Gazette/30.%20Revised%20Dentists%20%28Code%20of%20Ethics%29%20Regulations%2C%202014/Revised%20Dentists%20%28Code%20of%20Ethics%29%20Regulations%2C%202014.pdf",
  readingSteps: [
    "Read the issuing body, regulation title, year and scope before interpreting a rule.",
    "Make a glossary of consent, confidentiality, advertising ethics and registration concepts.",
    "Study dental infection prevention separately via the CDC reference and Indian local policy.",
    "Ask an appropriately qualified educator to verify the current enforceable regulatory position.",
  ],
} as const;

/** India government oral health programme directory, not UPSC test guidance. */
export const FIFTEENTH_DENTAL_READING = {
  id: "dghs-national-oral-health",
  subject: "Government Healthcare & Administration",
  subjectSlug: "govt-healthcare-administration",
  title: "National Oral Health Division / Programme",
  publisher: "Directorate General of Health Services, MoHFW, India",
  edition: "Official NOHD/NOHP programme page; living programme information",
  checkedOn: "24 November 2026",
  publisherUrl: "https://dghs.mohfw.gov.in/national-oral-health-division.php",
  guideUrl: "https://dghs.mohfw.gov.in/national-oral-health-division.php",
  readingSteps: [
    "Identify the Government of India programme aims and source date.",
    "Distinguish policy objectives, funded activities and local implementation.",
    "Open the official UPSC recruitment advertisement separately for current role duties.",
    "Avoid presenting any inferred recruitment-test topics as a UPSC-issued official syllabus.",
  ],
} as const;

/** Every subject has a publisher/institution source and the same guided reviewer intake. */
export const ALL_DENTAL_READINGS = [
  FIRST_DENTAL_READING, SECOND_DENTAL_READING, THIRD_DENTAL_READING,
  FOURTH_DENTAL_READING, FIFTH_DENTAL_READING, SIXTH_DENTAL_READING,
  SEVENTH_DENTAL_READING, EIGHTH_DENTAL_READING, NINTH_DENTAL_READING,
  TENTH_DENTAL_READING, ELEVENTH_DENTAL_READING, TWELFTH_DENTAL_READING,
  THIRTEENTH_DENTAL_READING, FOURTEENTH_DENTAL_READING, FIFTEENTH_DENTAL_READING,
] as const;

export type DentalReading = (typeof ALL_DENTAL_READINGS)[number];
