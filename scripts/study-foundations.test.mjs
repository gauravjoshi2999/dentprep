import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { checkStudyCourse } from './check-study-foundations.mjs';
const course = JSON.parse(readFileSync(new URL('../content/study/ph-frequency.v1.json', import.meta.url),'utf8'));
const sql = readFileSync(new URL('../ops/install-exam-quest-progress.sql', import.meta.url),'utf8');
test('real chapter arithmetic and server grading agree without claiming expert or official approval', () => {
  assert.equal(checkStudyCourse(course,sql).application_challenges,4);
  assert.throws(() => checkStudyCourse({...course, expert_approval_claimed:true},sql));
  assert.throws(() => checkStudyCourse({...course, official_questions:true},sql));
});
test('wrong calculations, swapped server keys and source substitution fail the release check', () => {
  const altered = structuredClone(course);
  altered.units[2].calculation.result = 30;
  assert.throws(() => checkStudyCourse(altered,sql),/arithmetic/);
  assert.throws(() => checkStudyCourse(course,sql.replace('ARRAY[1,0,2,1,0,2,0,2]','ARRAY[0,0,2,1,0,2,0,2]')),/Server scoring keys/);
  const unsafe = structuredClone(course); unsafe.sources[0].url='https://unknown.example/not-a-reference';
  assert.throws(() => checkStudyCourse(unsafe,sql),/publishers/);
});
