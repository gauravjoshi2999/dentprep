import { readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const publishers=['www.cdc.gov','archive.cdc.gov','www.who.int','www.nidcr.nih.gov','www.ncbi.nlm.nih.gov','www.aae.org','www.ada.org','www.ida.org.in','companion.sdcep.org.uk','www.msdmanuals.com','www.cancer.gov','www.perio.org','www.efp.org','www.gotoapro.org','aaoinfo.org','www.aapd.org','openstax.org','www.fda.gov','www.resus.org.uk','dghs.mohfw.gov.in','www.upsc.gov.in'];
function assert(ok,message){if(!ok)throw Error(message);}
export const studyDigest=c=>createHash('sha256').update(JSON.stringify(c)).digest('hex');
export function checkStudyCourse(c,sql){
 assert(['nonclinical_exam_foundation','source_checked_academic_study'].includes(c.scope)&&c.expert_approval_claimed===false&&c.official_questions===false&&c.complete_subject===false,'Source-led study must not claim expert approval, official questions or a complete subject');
 assert(/^[a-z0-9][a-z0-9-]{1,63}$/.test(c.id)&&Number.isInteger(c.version)&&c.version>0&&c.subject_slug,'Invalid study version identity');
 assert(c.authoring==='AI-assisted, primary-source checked','Authoring provenance required');
 const retention=c.kind==='retention';
 assert(c.units.length===(retention?2:8)&&c.units.filter(u=>u.phase==='learn').length===(retention?0:4)&&c.units.filter(u=>u.phase==='apply').length===(retention?2:4),'Bounded lessons and fresh applications required');
 assert(!retention||(c.required_course_id&&c.delay_hours===24),'Retention needs a parent and server-enforced delay');
 const ids=new Set(c.sources.map(s=>s.id));
 assert(ids.size===c.sources.length&&new Set(c.units.map(u=>u.id)).size===c.units.length,'Distinct source and challenge identities required');
 for(const source of c.sources){
  assert(source.title&&source.author_or_organization&&source.edition&&source.section&&source.content_version&&source.checked_on,'Complete reference metadata required');
  const url=new URL(source.url);
  assert(url.protocol==='https:'&&!url.username&&!url.password&&publishers.includes(url.hostname),'Only inspected primary publishers are currently allowed');
  assert(source.year===null||Number.isInteger(source.year)&&source.year>1800&&source.year<=new Date().getUTCFullYear(),'Source year cannot be invented or in the future');
  assert(source.year!==null||/not stated/i.test(source.edition),'Undated references must explicitly disclose an unstated publication year');
  const checked=new Date(`${source.checked_on}T00:00:00Z`);
  assert(/^\d{4}-\d{2}-\d{2}$/.test(source.checked_on)&&Number.isFinite(checked.getTime())&&checked.toISOString().slice(0,10)===source.checked_on&&source.checked_on<=new Date().toISOString().slice(0,10),'Source-check date must be real and not in the future');
 }
 for(const unit of c.units){
  assert(unit.lesson&&unit.question&&unit.hint&&unit.explanation&&unit.choices.length===3&&unit.rationales.length===3&&new Set(unit.choices.map(s=>s.toLowerCase().trim())).size===3&&unit.rationales.every(Boolean)&&[0,1,2].includes(unit.answer)&&unit.source_ids.length&&unit.source_ids.every(id=>ids.has(id)),'Every challenge needs one keyed choice, distinct options, source-linked explanation and all distractor rationales');
  if(unit.calculation?.kind==='percentage'){
   const{numerator,denominator,result}=unit.calculation;
   assert(numerator>=0&&denominator>0&&numerator<=denominator&&Math.abs(numerator/denominator*100-result)<1e-8&&unit.choices[unit.answer]===`${result}%`,'Wrong arithmetic or numeric key');
  }
  if(unit.calculation?.kind==='compare_proportions'){
   const{numerators:n,denominators:d}=unit.calculation;
   assert(n[0]/d[0]>n[1]/d[1]&&unit.answer===0,'Comparison key disagrees with arithmetic');
  }
  if(unit.calculation?.kind==='equal_proportions'){
   const{numerators:n,denominators:d,result}=unit.calculation;
   assert(n.every((value,index)=>value/d[index]*100===result)&&unit.answer===2,'Equal-proportion key disagrees with arithmetic');
  }
 }
 const stems=c.units.map(u=>u.question.toLowerCase().replace(/\W/g,''));
 assert(new Set(stems).size===stems.length,'Fresh application cannot reuse the same stem');
 const registry=sql.match(/\$catalog\$([\s\S]+?)\$catalog\$/)?.[1];
 if(registry){
  const entry=JSON.parse(registry).find(row=>row.course_id===c.id&&row.content_version===c.version);
  assert(entry&&JSON.stringify(entry.answer_key)===JSON.stringify(c.units.map(u=>u.answer)),'Server scoring keys must match the exact source catalogue');
  assert(entry.content_sha256===studyDigest(c)&&JSON.stringify(entry.unit_ids)===JSON.stringify(c.units.map(u=>u.id)),'Registry fingerprint and unit order must match the immutable content version');
 }else{
  const keys=sql.match(/right_keys integer\[\]:=ARRAY\[([0-9,]+)\]/)?.[1];
  assert(c.id==='ph-frequency'&&keys===c.units.map(u=>u.answer).join(','),'Server scoring keys must match the exact source catalogue');
 }
 return{course:c.id,version:c.version,lessons:retention?0:4,application_challenges:retention?2:4,content_sha256:studyDigest(c)};
}
if(process.argv[1]?.endsWith('check-study-foundations.mjs')){
 const sql=readFileSync('ops/seed-study-catalog.sql','utf8');
 const courses=['study','recall'].flatMap(folder=>readdirSync(`content/${folder}`).filter(name=>name.endsWith('.json')).map(name=>({path:`content/${folder}/${name}`,c:JSON.parse(readFileSync(`content/${folder}/${name}`,'utf8'))})));
 const curriculum=JSON.parse(readFileSync('content/curriculum.json','utf8'));
 assert(courses.length===30,'This release needs exactly 15 introductory chapters and 15 recall packages');
 const chapters=courses.filter(({c})=>c.kind!=='retention');
 assert(chapters.length===15&&curriculum.groups.every(g=>chapters.filter(({c})=>c.subject_slug===g.slug).length===1),'Every existing subject needs one actual chapter');
 const manifest=JSON.parse(readFileSync('content/study-manifest.json','utf8'));
 assert(manifest.length===courses.length,'Manifest must include every package');
 for(const{path,c}of courses){
  const result=checkStudyCourse(c,sql);
  const m=manifest.find(row=>row.course_id===c.id&&row.content_version===c.version);
  assert(m?.content_sha256===result.content_sha256&&m.required_course_id===(c.required_course_id??null)&&m.delay_hours===(c.delay_hours??0),'Browser manifest does not match server/content');
  if(c.kind==='retention'){
   const parent=chapters.find(({c:p})=>p.id===c.required_course_id)?.c;
   assert(parent&&c.units.every(u=>!parent.units.some(p=>p.question===u.question)),'Retention must use different stems from the source chapter');
  }
  let previous=null;
  try{previous=execFileSync('git',['show',`HEAD^:${path}`],{encoding:'utf8',stdio:['ignore','pipe','ignore']});}catch{}
  if(previous)assert(JSON.stringify(JSON.parse(previous))===JSON.stringify(c),'Published study versions are immutable; add a new version and preserve history');
  console.log(JSON.stringify(result));
 }
 assert(studyDigest(chapters.find(({c})=>c.id==='ph-frequency').c)==='6e815ac3a46cc9e620c3976b7d78bafedd5c9cba1944e453058214b31ecad177','Previously published PH v1 must remain unchanged');
 const review=JSON.parse(readFileSync('content/study-release.v1.json','utf8'));
 assert(review.gates.length===20&&review.gates.every((g,index)=>g.id===`E${String(index+1).padStart(2,'0')}`&&g.scope&&g.evidence),'All 20 educational gates need an honest scoped assessment');
 assert(review.clinical_publication_authorized===false&&review.complete_curriculum_claimed===false&&review.independent_clinical_approval===null,'This academic release cannot certify clinical publication or complete coverage');
 console.log('PASS: 15 subjects, 60 teaching sections, 120 chapter questions, 30 next-day retrieval questions; clinical drafts unchanged');
}
