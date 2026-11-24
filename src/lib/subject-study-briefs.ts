/**
 * Non-clinical reading plans for every published DentPrep subject category.
 * These are study-navigation prompts, NOT approved clinical lessons, MCQ keys,
 * diagnostic rules, drug advice, procedures, or a UPSC-issued exam syllabus.
 */
export type SubjectStudyBrief = {
  slug: string;
  name: string;
  category: "Clinical" | "Basics" | "Public Health";
  chapters: readonly { title: string; task: string }[];
  recall: readonly string[];
};

export const SUBJECT_STUDY_BRIEFS: readonly SubjectStudyBrief[] = [
  {
    slug: "oral-medicine-radiology", name: "Oral Medicine & Radiology", category: "Clinical",
    chapters: [
      { title: "Oral lesion terminology", task: "Build a glossary of macule, papule, plaque, erosion and ulcer using your BDS text." },
      { title: "Clinical examination records", task: "List the history, location and morphology details to document; distinguish observation from diagnosis." },
      { title: "Oral potentially malignant disorders", task: "Map classification headings and referral questions to edition-specific primary sources." },
      { title: "Dental imaging vocabulary", task: "Compare bitewing, periapical, occlusal and panoramic imaging purposes and limitations." },
      { title: "Source appraisal", task: "Check the ADA guideline date, population, evidence quality and Indian applicability with faculty." },
    ],
    recall: ["What makes a finding different from a definitive diagnosis?", "Which observations belong in an oral lesion description?", "What date and population apply to the reference you opened?"],
  },
  {
    slug: "oral-maxillofacial-surgery", name: "Oral & Maxillofacial Surgery", category: "Clinical",
    chapters: [
      { title: "Preoperative assessment", task: "Create a history-taking checklist of relevant medical, dental and medication questions." },
      { title: "Anatomy for exodontia", task: "Revise root morphology, jaw relations and the anatomical structures mentioned in your atlas." },
      { title: "Bleeding-risk literature", task: "Compare the VKA, DOAC and antiplatelet sections of SDCEP by scope, without choosing a patient regimen." },
      { title: "Consent and complications", task: "Separate informed-consent topics, follow-up concepts and referral red flags for educator discussion." },
      { title: "Clinical reasoning practice", task: "Record uncertainty and source gaps in OMS-001 before its exact-version clinical review." },
    ],
    recall: ["Which facts must be known before assessing a scenario?", "Why does a medicine category matter to source interpretation?", "What questions require specialist review rather than an MCQ shortcut?"],
  },
  {
    slug: "conservative-endodontics", name: "Conservative Dentistry & Endodontics", category: "Clinical",
    chapters: [
      { title: "Tooth structure & caries", task: "Revise enamel, dentin, pulp and caries terminology from foundational sources." },
      { title: "Restoration vocabulary", task: "Compare restorative material categories and their textbook-described properties." },
      { title: "Pulpal and periapical terms", task: "Build a comparison table using the current AAE terminology references." },
      { title: "Diagnostic evidence", task: "List history, clinical examination and imaging evidence separately without issuing a diagnosis." },
      { title: "Outcome and follow-up", task: "Identify definitions used for success, failure and patient-reported outcomes in faculty notes." },
    ],
    recall: ["Which structures are involved in the pulp–periapical relationship?", "How do definitions differ from a diagnosis?", "Which item needs a dated professional reference?"],
  },
  {
    slug: "periodontology", name: "Periodontology", category: "Clinical",
    chapters: [
      { title: "Periodontal anatomy", task: "Sketch gingiva, periodontal ligament, cementum and alveolar bone labels." },
      { title: "Inflammation and disease terms", task: "Contrast gingival and periodontal disease terminology in your chosen source." },
      { title: "Classification", task: "Locate staging and grading definitions in the EFP guidance with its edition." },
      { title: "Risk and outcome measures", task: "Make a table of risk-factor and outcome headings without applying them to a patient." },
      { title: "Maintenance and prevention", task: "Identify supportive care and follow-up topics for later faculty-approved lessons." },
    ],
    recall: ["What anatomical structures support a tooth?", "What is classification versus case-specific planning?", "Which outcomes does the source actually report?"],
  },
  {
    slug: "prosthodontics", name: "Prosthodontics", category: "Clinical",
    chapters: [
      { title: "Dentate and edentulous terminology", task: "Classify foundational terms for complete and partial tooth loss." },
      { title: "Removable prosthodontics", task: "Revise component names and indications as textbook index topics." },
      { title: "Fixed prosthodontics", task: "Map basic crown, bridge and abutment vocabulary with illustrative diagrams." },
      { title: "Occlusion and jaw relationships", task: "Build a glossary and compare the terms used in your BDS syllabus." },
      { title: "Prosthodontic diagnostic indices", task: "Explore ACP resource categories; note that a specialty index is not treatment approval." },
    ],
    recall: ["How does complete edentulism differ from partial edentulism?", "Which terms describe an index, not a treatment?", "Which sources support each definition?"],
  },
  {
    slug: "orthodontics", name: "Orthodontics", category: "Clinical",
    chapters: [
      { title: "Craniofacial growth", task: "Organise major growth and development concepts as a labelled timeline." },
      { title: "Occlusion and malocclusion", task: "Compare commonly taught classification terminology with diagrams." },
      { title: "Records and measurements", task: "List orthodontic records and the questions each may help address." },
      { title: "Appliance vocabulary", task: "Group removable, fixed and retention-related terms without planning care." },
      { title: "Consent and follow-up", task: "Find dated BOS documents on records, consent and retention; discuss UK/India differences." },
    ],
    recall: ["What is a classification compared with a treatment goal?", "Which documents support consent and retention terms?", "What is the source's jurisdiction?"],
  },
  {
    slug: "pediatric-dentistry", name: "Pediatric Dentistry", category: "Clinical",
    chapters: [
      { title: "Dentition chronology", task: "Make a primary-versus-permanent dentition diagram from a BDS text." },
      { title: "Child communication", task: "List age-appropriate communication and guardian-consent considerations." },
      { title: "Prevention & risk concepts", task: "Find AAPD material on prevention, risk and oral health policies." },
      { title: "Developing teeth", task: "Revise primary tooth morphology and eruption terminology." },
      { title: "Pediatric safety boundaries", task: "Flag child-specific medication, sedation and emergency claims for qualified review." },
    ],
    recall: ["Why should adult guidance not be copied to pediatric cases?", "What source and date define the studied policy?", "What should be confirmed with a pediatric dentist?"],
  },
  {
    slug: "public-health-dentistry", name: "Public Health Dentistry", category: "Public Health",
    chapters: [
      { title: "Epidemiology vocabulary", task: "Contrast incidence, prevalence, risk factors and surveillance using definitions." },
      { title: "Dental indices", task: "Build an index-name and purpose table from your dental public-health textbook." },
      { title: "Oral disease burden", task: "Read WHO oral-health data and separate global from India-specific estimates." },
      { title: "Prevention programs", task: "Map health-promotion, screening and community programme topics." },
      { title: "Infection prevention", task: "Read CDC standard precautions as a US professional source, not Indian regulation." },
    ],
    recall: ["How do incidence and prevalence differ?", "What population did the reference study?", "Which programme facts need a current Indian government source?"],
  },
  {
    slug: "oral-pathology", name: "Oral Pathology", category: "Clinical",
    chapters: [
      { title: "Histology foundations", task: "Revise normal oral epithelium, salivary tissue and tooth-development vocabulary." },
      { title: "Diagnostic descriptors", task: "Build a glossary of lesion architecture and microscopic description terms." },
      { title: "Cysts and tumours", task: "Organise major classification headings from the WHO/IARC index by tissue and site." },
      { title: "Potentially malignant disorders", task: "Note where classification updates affect terminology; avoid drawing diagnosis from an image." },
      { title: "Evidence and pathology reports", task: "Compare morphology description, differential considerations and definitive reporting." },
    ],
    recall: ["Which features are descriptors rather than diagnoses?", "What version of the classification is being used?", "Which parts of a pathology report require expert verification?"],
  },
  {
    slug: "general-medicine-surgery", name: "General Medicine & Surgery", category: "Basics",
    chapters: [
      { title: "Systemic history", task: "Build a study checklist of cardiovascular, endocrine, respiratory and bleeding-history headings." },
      { title: "Inflammation and infection", task: "Revise general vocabulary and distinguish signs, syndromes and investigations." },
      { title: "Surgical foundations", task: "Study wound healing, asepsis and perioperative terminology from an approved textbook." },
      { title: "Medical investigations", task: "Classify common investigation types and limits without interpreting real patient results." },
      { title: "Dental-medical interface", task: "List areas where clinical coordination or specialist consultation is needed." },
    ],
    recall: ["Which history headings may change clinical risk assessment?", "What can a finding establish versus merely suggest?", "Which claims require a locally approved medical source?"],
  },
  {
    slug: "pharmacology-dental-materials", name: "Pharmacology & Dental Materials", category: "Basics",
    chapters: [
      { title: "General pharmacology terms", task: "Contrast pharmacokinetics, pharmacodynamics and therapeutic index definitions." },
      { title: "Drug classes in dentistry", task: "Build a no-dosage classification outline using the BDS curriculum headings." },
      { title: "Adverse effects and interactions", task: "Identify where current authoritative medicine references are required." },
      { title: "Dental material properties", task: "Compare adhesion, strength, solubility and biocompatibility as material-science terms." },
      { title: "Materials families", task: "Group impression, restorative and luting material names from a standard textbook." },
    ],
    recall: ["What is the difference between a drug class and a prescribing instruction?", "Which material properties are physical versus biological?", "What source would be needed before any dosage-related teaching?"],
  },
  {
    slug: "basic-medical-sciences", name: "Basic Medical Sciences", category: "Basics",
    chapters: [
      { title: "Head-and-neck anatomy", task: "Label major bones, muscles, vessels and cranial nerve branches using an anatomy atlas." },
      { title: "Physiology fundamentals", task: "Explain homeostasis and core cardiovascular and respiratory physiology terms." },
      { title: "Biochemistry vocabulary", task: "Map enzymes, metabolism and nutrition concepts as BDS foundation topics." },
      { title: "Microbiology foundation", task: "Distinguish organism groups, colonisation and infection terminology." },
      { title: "Clinical bridge", task: "Record where a foundation concept needs specialist explanation before clinical application." },
    ],
    recall: ["Which structures are linked anatomically rather than functionally?", "How do normal physiology and pathology differ?", "Which concept could you explain in 60 seconds?"],
  },
  {
    slug: "medical-emergencies", name: "Medical Emergencies", category: "Basics",
    chapters: [
      { title: "Emergency vocabulary", task: "List the terms for deterioration, handover, escalation and team roles." },
      { title: "WHO Basic Emergency Care scope", task: "Locate introductory modules and note the WHO/ICRC training audience." },
      { title: "Recognition frameworks", task: "Compare high-level headings for airway, breathing and circulation without creating a treatment protocol." },
      { title: "Preparedness", task: "List topics for faculty to verify: local policy, personnel readiness and referral pathways." },
      { title: "Scenario discussion", task: "Practise explaining what information is missing before any action is chosen." },
    ],
    recall: ["What facts would be essential at handover?", "Which training content is context-specific?", "When does a student need immediate qualified supervision?"],
  },
  {
    slug: "infection-control-ethics", name: "Infection Control & Ethics", category: "Basics",
    chapters: [
      { title: "Standard precautions", task: "Compare hand hygiene, PPE and instrument processing as separate source headings." },
      { title: "Infection-control systems", task: "Map equipment flows and recordkeeping concepts, not unverified procedural instructions." },
      { title: "Consent and confidentiality", task: "Make a glossary of autonomy, privacy, consent and documentation." },
      { title: "Professional ethics", task: "Find the current Indian dental ethics regulations; verify amendment and jurisdiction." },
      { title: "Risk and reporting", task: "List the questions needing local clinic policy or legal review." },
    ],
    recall: ["How do sterilisation and disinfection differ conceptually?", "What does informed consent require as a principle?", "Why do US infection guidance and Indian regulation need separate checks?"],
  },
  {
    slug: "govt-healthcare-administration", name: "Government Healthcare & Administration", category: "Public Health",
    chapters: [
      { title: "Public oral-health programs", task: "Read the Government of India's NOHP/NOHD objectives and record document dates." },
      { title: "Health-system structure", task: "Map primary, secondary and tertiary care in the Indian context." },
      { title: "Administration basics", task: "List record management, quality, resource planning and programme monitoring terms." },
      { title: "Government dental service", task: "Read the current UPSC advertisement for actual duties; distinguish it from an assumed test syllabus." },
      { title: "Policy appraisal", task: "Compare an official guideline, scheme notice and an outdated exam coaching claim." },
    ],
    recall: ["Which government document states the role's duties?", "What is a programme objective versus an implemented service?", "Has UPSC actually issued a recruitment-test syllabus?"],
  },
] as const;

export const STUDY_BRIEF_BY_SLUG = new Map(SUBJECT_STUDY_BRIEFS.map((item) => [item.slug, item]));
