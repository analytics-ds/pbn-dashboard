// Applique la selection de sites suivis envoyee par le dashboard (via une issue
// GitHub au titre "[pbn-track] ..."). Lit le bloc ```json [...] ``` du corps de
// l'issue (tableau de proprietes GSC), fusionne avec src/tracked.json en
// conservant repo/articlesPath des sites deja connus, et reecrit tracked.json.
import { readFileSync, writeFileSync } from 'node:fs';

const body = process.env.ISSUE_BODY || '';
const m = body.match(/```json\s*([\s\S]*?)```/i);
if (!m) {
  console.error('Aucun bloc ```json``` trouve dans le corps de l issue.');
  process.exit(2);
}
let props;
try {
  props = JSON.parse(m[1].trim());
} catch (e) {
  console.error('JSON invalide dans l issue:', e.message);
  process.exit(2);
}
if (!Array.isArray(props)) {
  console.error('Le bloc json doit etre un tableau de proprietes GSC.');
  process.exit(2);
}

function domainOf(p) {
  if (!p) return '';
  if (p.startsWith('sc-domain:')) return p.slice('sc-domain:'.length);
  try {
    return new URL(p).host.replace(/^www\./, '');
  } catch {
    return p;
  }
}

const trackedUrl = new URL('../src/tracked.json', import.meta.url);
const current = JSON.parse(readFileSync(trackedUrl, 'utf8'));
const byProp = new Map(current.map((s) => [s.gscProperty, s]));

const seen = new Set();
const next = [];
for (const p of props) {
  if (typeof p !== 'string' || !p || seen.has(p)) continue;
  seen.add(p);
  next.push(byProp.get(p) || { domain: domainOf(p), gscProperty: p, repo: null, articlesPath: null });
}
next.sort((a, b) => a.domain.localeCompare(b.domain));

writeFileSync(trackedUrl, JSON.stringify(next, null, 2) + '\n');
console.log('tracked.json mis a jour :', next.length, 'sites suivis.');
