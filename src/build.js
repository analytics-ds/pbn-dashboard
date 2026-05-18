import { mkdir, writeFile } from 'node:fs/promises';
import { SITES } from './sites.js';
import { buildAuth, fetchSiteWindows, rangesForWindow } from './gsc.js';
import { fetchArticlesWindows } from './articles.js';
import { renderDashboard } from './render.js';

const required = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REFRESH_TOKEN', 'GH_TOKEN'];
const missing = required.filter(k => !process.env[k]);
if (missing.length) {
  console.error(`Variables manquantes: ${missing.join(', ')}`);
  process.exit(1);
}

const auth = buildAuth({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
});

console.log(`Pull data pour ${SITES.length} sites x 3 fenetres (7/28/90)...`);

const sitesData = await Promise.all(SITES.map(async (site) => {
  const [gsc, articles] = await Promise.all([
    fetchSiteWindows(auth, site.gscProperty).catch(err => ({ '7': { error: err.message } })),
    fetchArticlesWindows({ repo: site.repo, articlesPath: site.articlesPath }).catch(() => ({ '7': 0, '28': 0, '90': 0 })),
  ]);

  const data = {
    windows: gsc,
    articles,
  };

  const w7 = gsc['7'];
  const status = w7?.error
    ? `ERR ${w7.error.slice(0, 80)}`
    : `${w7?.current?.clicks ?? 0} clics 7j | ${articles['7'] ?? 0} articles 7j`;
  console.log(`  ${site.domain.padEnd(28)} ${status}`);

  return { site, data };
}));

const periods = {
  '7': rangesForWindow(7).current,
  '28': rangesForWindow(28).current,
  '90': rangesForWindow(90).current,
};

const html = renderDashboard({
  sitesData,
  generatedAt: new Date().toISOString(),
  periods,
});

await mkdir('dist', { recursive: true });
await writeFile('dist/index.html', html);
await writeFile('dist/.nojekyll', '');

console.log(`\nGenere: dist/index.html (${(html.length / 1024).toFixed(1)} KB)`);
