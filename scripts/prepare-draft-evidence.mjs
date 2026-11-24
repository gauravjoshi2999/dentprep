import { readFileSync, realpathSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { preparationSql, preparationVerificationSql } from './draft-preparation.mjs';

// Print a reviewable transaction. This command has no database connection or execution capability.
const name = process.argv[2];
if (!name || !/^[A-Z]{2,5}-\d{3}$/.test(name)) throw Error('Supply an existing packet id, for example OMS-001');
const root = realpathSync(process.cwd());
const read = path => {
  const absolute = realpathSync(resolve(root, path));
  if (!absolute.startsWith(`${root}${sep}content${sep}`)) throw Error('Preparation file escaped content directory');
  return readFileSync(absolute, 'utf8');
};
const packet = JSON.parse(read(`content/drafts/${name}.review.json`));
if (packet.packet_id !== name) throw Error('Packet filename/identity mismatch');
// Validate the path before reading the associated revision candidate.
if (!/^content\/preparation\/[A-Za-z0-9._-]+\.md$/.test(packet.revision_candidate?.path)) throw Error('Invalid revision candidate path');
const mode = process.argv[3];
if (mode !== undefined && mode !== '--verify') throw Error('Only --verify is accepted after the packet id');
process.stdout.write((mode === '--verify' ? preparationVerificationSql : preparationSql)(packet, {
  inventory: JSON.parse(read('content/draft-inventory.json')),
  candidateText: read(packet.revision_candidate.path),
  today: new Date().toISOString().slice(0, 10),
}));
