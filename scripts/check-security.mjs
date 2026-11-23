import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

// Scan tracked source, never local ignored credentials or dependency code.
const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
const failures = [];
for (const path of files) {
  if (/\.(?:jks|keystore)$/.test(path)) failures.push(`${path}: Android signing key is tracked`);
  if (/(^|\/)\.env(?:\.|$)/.test(path) && !path.endsWith('.env.example')) failures.push(`${path}: private environment file is tracked`);
  const text = readFileSync(path, 'utf8');
  if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(text)) failures.push(`${path}: private key found`);
  if (/sb_secret_[a-zA-Z0-9_-]{16,}/.test(text)) failures.push(`${path}: Supabase secret key found`);
  for (const jwt of text.match(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g) ?? []) {
    try {
      if (JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString()).role === 'service_role') failures.push(`${path}: service role JWT found`);
    } catch { /* A non-JWT example is not a credential. */ }
  }
  if (path.startsWith('src/') && !path.includes('.server.') && /from\s+["'][^"']*client\.server["']/.test(text)) failures.push(`${path}: server admin client imported into browser-capable code`);
  if (/VITE_[A-Z_]*(?:SECRET|SERVICE_ROLE|PRIVATE_KEY)\s*[=:]/.test(text)) failures.push(`${path}: secret configured as a public environment variable`);
}
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Source security checks passed (${files.length} tracked files).`);
}
