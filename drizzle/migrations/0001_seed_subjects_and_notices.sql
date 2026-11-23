INSERT INTO public.subjects (slug, name, short_name, description, icon, sort_order, status) VALUES
('oral-medicine-radiology','Oral Medicine & Radiology','Oral Medicine','Diagnosis of oral mucosal disease, systemic links, and safe use and interpretation of dental imaging.','scan',1,'published'),
('oral-maxillofacial-surgery','Oral & Maxillofacial Surgery','Oral Surgery','Exodontia, local anaesthesia, odontogenic infections, maxillofacial trauma and surgical safety.','scissors',2,'published'),
('conservative-endodontics','Conservative Dentistry & Endodontics','Endodontics','Caries management, restorative principles, pulp diagnosis and root canal treatment.','drill',3,'published'),
('periodontology','Periodontology','Periodontics','Periodontal anatomy, classification, diagnosis, non-surgical and surgical therapy.','layers',4,'published'),
('prosthodontics','Prosthodontics','Prosthodontics','Complete, removable and fixed prostheses, occlusion and implant basics.','crown',5,'published'),
('orthodontics','Orthodontics','Orthodontics','Growth and development, malocclusion classification, appliances and interceptive care.','align',6,'published'),
('pediatric-dentistry','Pediatric Dentistry','Pediatric','Child behaviour management, primary dentition care, pulp therapy and trauma.','baby',7,'published'),
('public-health-dentistry','Public Health Dentistry','Public Health','Epidemiology, indices, preventive programmes, fluorides and oral health policy.','users',8,'published'),
('oral-pathology','Oral Pathology','Oral Pathology','Developmental, cystic, neoplastic and potentially malignant disorders of the oral cavity.','microscope',9,'published'),
('general-medicine-surgery','General Medicine & Surgery','Medicine & Surgery','Systemic diseases relevant to dental care, perioperative assessment and surgical principles.','stethoscope',10,'published'),
('pharmacology-dental-materials','Pharmacology & Dental Materials','Pharma & Materials','Drugs used in dentistry, interactions, and the science of restorative and impression materials.','pill',11,'published'),
('basic-medical-sciences','Basic Medical Sciences','Basic Sciences','Applied anatomy, physiology, biochemistry and microbiology for the dental surgeon.','brain',12,'published'),
('medical-emergencies','Medical Emergencies','Emergencies','Recognition and first-line management of emergencies in the dental chair.','siren',13,'published'),
('infection-control-ethics','Infection Control & Ethics','Infection & Ethics','Standard precautions, sterilisation, waste management, consent and professional ethics.','shield',14,'published'),
('govt-healthcare-administration','Government Healthcare & Administration','Govt Healthcare','National programmes, CGHS, hospital administration and the role of a Group A dental surgeon.','landmark',15,'published');

WITH n AS (
  INSERT INTO public.recruitment_notices (title, advt_no, vacancy_no, posts, summary, key_facts, official_url, source_url, published_on, opens_on, closing_at, verified_on, verification_note, is_official, status)
  VALUES (
    'Dental Surgeon, Department of Health & Family Welfare (MoHFW)',
    'Advertisement No. 13/2026', '26111301114', 5,
    'UPSC invites online recruitment applications for five vacancies of Dental Surgeon in the Department of Health & Family Welfare, Ministry of Health & Family Welfare. Selection is by interview (out of 100 marks); UPSC may shortlist through a Recruitment Test if it decides to hold one. Any detailed syllabus or pattern for a Recruitment Test has not been published in this advertisement.',
    '[
      {"label":"Vacancies","value":"5 (UR-03, EWS-01, SC-01); 1 reserved for PwBD"},
      {"label":"Pay","value":"Level 10 in the Pay Matrix (7th CPC)"},
      {"label":"Upper age limit","value":"35 years (UR/EWS), 40 years (SC); relaxable up to 10 years for PwBD"},
      {"label":"Essential qualification","value":"Recognised BDS (Part I, Dentists Act 1948) or equivalent listed qualification; registration with a State Dental Council; completion of compulsory rotating internship before appointment"},
      {"label":"Duties (as listed)","value":"OPD and indoor patients at Safdarjung Hospital, Dr. RML Hospital and RHTC Najafgarh; medical attendance for CGHS beneficiaries; other assigned duties"},
      {"label":"Service","value":"General Central Service, Group A, Gazetted, Non-Ministerial; probation 1 year; headquarters anywhere in India"},
      {"label":"Interview","value":"Total 100 marks. Minimum suitability: UR 50, OBC 45, SC/ST/PwBD 40"},
      {"label":"Recruitment Test","value":"Possible, at the Commission''s discretion (\"if held\"). No syllabus or pattern published in this advertisement."},
      {"label":"Application window","value":"Opens 14-11-2026; closes 18:00 hrs IST on 04-12-2026 at upsconline.nic.in"},
      {"label":"Fee","value":"Rs. 25 (exempt: female, SC, ST, PwBD candidates)"}
    ]'::jsonb,
    'https://upsc.gov.in/uploads/2026/11/AdvtNo-13-2026-Engl-131126_0.pdf',
    'https://upsc.gov.in/advertisements/',
    '2026-11-13', '2026-11-14', '2026-12-04 12:30:00+00', '2026-11-23',
    'Each fact above was read directly from the official English PDF of Advertisement No. 13/2026 on 23 Nov 2026. Interview dates will be intimated separately by UPSC. Always re-check the UPSC website for corrigenda before acting.',
    true, 'published')
  RETURNING id
)
INSERT INTO public.content_sources (entity_type, entity_id, citation, url)
SELECT 'notice', n.id, c.citation, c.url FROM n, (VALUES
  ('UPSC Advertisement No. 13/2026 (English PDF)', 'https://upsc.gov.in/uploads/2026/11/AdvtNo-13-2026-Engl-131126_0.pdf'),
  ('UPSC Recruitment Advertisements page', 'https://upsc.gov.in/advertisements/'),
  ('UPSC Online Recruitment Application portal', 'https://upsconline.nic.in')
) AS c(citation, url);