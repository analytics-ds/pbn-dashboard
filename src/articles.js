const GH_BASE = 'https://api.github.com';

async function ghFetch(path) {
  const res = await fetch(`${GH_BASE}${path}`, {
    headers: {
      'Authorization': `Bearer ${process.env.GH_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'pbn-dashboard',
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GH API ${res.status} ${path}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

function isoDaysAgo(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString();
}

/**
 * Compte les fichiers .md ajoutes dans articlesPath sur une fenetre de N jours.
 * Dedupe par chemin (uniquement les commits 'added', hors _index.md / .gitkeep).
 */
async function countArticles({ repo, articlesPath }, days) {
  const since = isoDaysAgo(days);
  let commits;
  try {
    commits = await ghFetch(`/repos/${repo}/commits?since=${since}&path=${encodeURIComponent(articlesPath)}&per_page=100`);
  } catch (err) {
    return { count: 0, error: err.message };
  }

  const added = new Set();
  for (const c of commits) {
    let details;
    try {
      details = await ghFetch(`/repos/${repo}/commits/${c.sha}`);
    } catch {
      continue;
    }
    for (const f of details.files ?? []) {
      const name = f.filename ?? '';
      if (
        f.status === 'added' &&
        name.startsWith(`${articlesPath}/`) &&
        name.endsWith('.md') &&
        !name.endsWith('_index.md') &&
        !name.endsWith('.gitkeep')
      ) {
        added.add(name);
      }
    }
  }

  return { count: added.size };
}

export async function fetchArticlesWindows({ repo, articlesPath }) {
  if (!repo || !articlesPath) {
    return { '7': 0, '28': 0, '90': 0, noRepo: true };
  }
  const [a7, a28, a90] = await Promise.all([
    countArticles({ repo, articlesPath }, 7),
    countArticles({ repo, articlesPath }, 28),
    countArticles({ repo, articlesPath }, 90),
  ]);
  return { '7': a7.count, '28': a28.count, '90': a90.count, error: a7.error || a28.error || a90.error };
}
