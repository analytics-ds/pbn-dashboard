import { mkdir, writeFile } from 'node:fs/promises';
import { SITES } from './sites.js';
import { buildAuth, fetchSiteMetrics, getDateRanges } from './gsc.js';
import { fetchArticlesThisWeek } from './articles.js';
import { renderDashboard } from './render.js';

const required = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REFRESH_TOKEN', 'GH_TOKEN'];
const missing = required.filter(k => !process.env[k]);
if (missing.length) {
  console.error(`Variables manquantes: ${missing.join(', ')}`);
  console.error('Voir README.md pour le setup des credentials.');
  process.exit(1);
}

const auth = buildAuth({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
});

console.log(`Pull data pour ${SITES.length} sites...`);

const sitesData = await Promise.all(SITES.map(async (site) => {
  const [gsc, articles] = await Promise.all([
    fetchSiteMetrics(auth, site.gscProperty).catch(err => ({ error: err.message })),
    fetchArticlesThisWeek({ repo: site.repo, articlesPath: site.articlesPath }).catch(err => ({ count: 0, error: err.message })),
  ]);

  const data = {
    ...gsc,
    articlesCount: articles.count ?? 0,
    articlesError: articles.error,
  };

  const status = gsc.error
    ? `ERR ${gsc.error.slice(0, 80)}`
    : `${gsc.current?.clicks ?? 0} clics | ${articles.count ?? 0} articles`;
  console.log(`  ${site.domain.padEnd(28)} ${status}`);

  return { site, data };
}));

const { current } = getDateRanges();
const html = renderDashboard({
  sitesData,
  generatedAt: new Date().toISOString(),
  period: current,
});

await mkdir('dist', { recursive: true });
await writeFile('dist/index.html', html);

// Aussi un .nojekyll pour GH Pages
await writeFile('dist/.nojekyll', '');

console.log(`\nGenere: dist/index.html (${(html.length / 1024).toFixed(1)} KB)`);
