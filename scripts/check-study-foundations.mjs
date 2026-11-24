import { readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

function assert(ok, message) { if (!ok) throw Error(message); }
export function checkStudyCourse(c, sql) {
  assert(c.scope === 'nonclinical_exam_foundation' && c.expert_approval_claimed === false && c.official_questions === false && c.complete_subject === false,
    'Source-led foundations must not claim expert approval, official questions or a complete subject');
  assert(c.id === 'ph-frequency' && c.version === 1 && c.subject_slug === 'public-health-dentistry', 'Unknown foundation course version');
  assert(c.authoring === 'AI-assisted, primary-source checked', 'Authoring provenance required');
  assert(c.sources.length >= 4 && c.units.length === 8 && c.units.filter(u => u.phase === 'learn').length === 4 && c.units.filter(u => u.phase === 'apply').length === 4, 'Bounded lessons and fresh applications required');
  const ids = new Set(c.sources.map(s => s.id));
  assert(ids.size === c.sources.length && new Set(c.units.map(u => u.id)).size === 8, 'Distinct source and challenge identities required');
  for (const source of c.sources) {
    assert(source.title && source.author_or_organization && source.edition && source.year && source.section && source.content_version && source.checked_on, 'Complete reference metadata required');
    const url = new URL(source.url);
    assert(url.protocol === 'https:' && !url.username && !url.password && ['www.cdc.gov', 'archive.cdc.gov', 'www.who.int'].includes(url.hostname), 'Only the inspected primary publishers are currently allowed');
    const checked = new Date(`${source.checked_on}T00:00:00Z`);
    assert(Number.isInteger(source.year) && source.year > 1800 && source.year <= new Date().getUTCFullYear(), 'Source year cannot be invented or in the future');
    assert(/^\d{4}-\d{2}-\d{2}$/.test(source.checked_on) && Number.isFinite(checked.getTime()) && checked.toISOString().slice(0,10) === source.checked_on && source.checked_on <= new Date().toISOString().slice(0,10), 'Source-check date must be real and not in the future');
  }
  assert(c.units.map(u => u.id).join(',') === 'survey,denominator,prevalence,incidence,survey-transfer,denominator-transfer,prevalence-transfer,incidence-transfer', 'Only the bounded population-measurement chapter is admitted by this foundation release');
  for (const unit of c.units) {
    assert(unit.lesson && unit.question && unit.hint && unit.explanation && unit.choices.length === 3 && unit.rationales.length === 3 &&
      new Set(unit.choices.map(s => s.toLowerCase().trim())).size === 3 && unit.rationales.every(Boolean) && [0,1,2].includes(unit.answer) && unit.source_ids.length && unit.source_ids.every(id => ids.has(id)),
      'Every original challenge needs one keyed choice, distinct options, source-linked explanation and all distractor rationales');
    if (unit.calculation?.kind === 'percentage') {
      const { numerator, denominator, result } = unit.calculation;
      assert(numerator >= 0 && denominator > 0 && numerator <= denominator && Math.abs(numerator / denominator * 100 - result) < 1e-8 && unit.choices[unit.answer] === `${result}%`, 'Wrong arithmetic or numeric key');
    }
    if (unit.calculation?.kind === 'compare_proportions') {
      const { numerators: n, denominators: d } = unit.calculation;
      assert(n[0]/d[0] > n[1]/d[1] && unit.answer === 0, 'Comparison key disagrees with arithmetic');
    }
    if (unit.calculation?.kind === 'equal_proportions') {
      const { numerators: n, denominators: d, result } = unit.calculation;
      assert(n.every((value,index) => value/d[index]*100 === result) && unit.answer === 2, 'Equal-proportion key disagrees with arithmetic');
    }
  }
  const normalized = c.units.map(u => u.question.toLowerCase().replace(/\W/g,''));
  assert(new Set(normalized).size === normalized.length, 'Fresh application cannot reuse the same stem');
  const keys = sql.match(/right_keys integer\[\]:=ARRAY\[([0-9,]+)\]/)?.[1];
  assert(keys === c.units.map(u => u.answer).join(','), 'Server scoring keys must match the exact source catalogue');
  return { course: c.id, version: c.version, lessons: 4, application_challenges: 4, content_sha256: createHash('sha256').update(JSON.stringify(c)).digest('hex') };
}

if (process.argv[1]?.endsWith('check-study-foundations.mjs')) {
  const sql = readFileSync('ops/install-exam-quest-progress.sql','utf8');
  for (const name of readdirSync('content/study').filter(name => name.endsWith('.json'))) {
    const path = `content/study/${name}`;
    const c = JSON.parse(readFileSync(path,'utf8'));
    const result = checkStudyCourse(c, sql);
    let previous = null;
    try { previous = execFileSync('git',['show',`HEAD^:${path}`],{encoding:'utf8',stdio:['ignore','pipe','ignore']}); } catch { /* first source version */ }
    if (previous) assert(JSON.stringify(JSON.parse(previous)) === JSON.stringify(c), 'Published foundation versions are immutable; add a new version and preserve previous history');
    console.log(JSON.stringify(result));
  }
}
