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

// articlesPath accepte une string ou un tableau de strings : certains blogs
// (top-activites) n'ont pas de dossier "blog" et rangent leurs articles dans
// plusieurs sections de premier niveau.
function normalizePaths(articlesPath) {
  if (!articlesPath) return [];
  return (Array.isArray(articlesPath) ? articlesPath : [articlesPath]).filter(Boolean);
}

/**
 * Un chemin compte comme article si :
 *  - il est sous un des articlesPath (recursivement),
 *  - c'est un .md qui n'est pas un _index.md (page de section Hugo),
 *  - ce n'est pas une traduction en suffixe de langue (article.en.md), utilisee
 *    par meilleursextoy la ou les autres blogs traduisent sous content/en/.
 *    Sans ca, le site compte deux fois ses articles.
 */
function isArticle(name, paths) {
  if (!name.endsWith('.md')) return false;
  const base = name.slice(name.lastIndexOf('/') + 1);
  if (base.startsWith('_index.')) return false;
  if (/\.[a-z]{2}\.md$/.test(base)) return false;
  if (base === '.gitkeep') return false;
  return paths.some(p => name.startsWith(`${p}/`));
}

/**
 * Nombre d'articles PRESENTS dans le repo (photo de l'etat du site), lu dans
 * l'arbre git en une seule requete. A ne pas confondre avec le flux d'articles
 * publies sur une fenetre, ci-dessous.
 */
async function fetchArticlesTotal({ repo, articlesPath }) {
  const paths = normalizePaths(articlesPath);
  if (!repo || !paths.length) return { total: null };
  let tree;
  try {
    tree = await ghFetch(`/repos/${repo}/git/trees/HEAD?recursive=1`);
  } catch (err) {
    return { total: null, error: err.message };
  }
  if (tree.truncated) {
    return { total: null, error: 'arbre git tronque par GitHub' };
  }
  const total = (tree.tree ?? []).filter(
    e => e.type === 'blob' && isArticle(e.path ?? '', paths)
  ).length;
  return { total };
}

/**
 * Date d'ajout de chaque article sur les 90 derniers jours, en UNE passe.
 * L'ancienne version relancait la meme collecte pour 7, 28 et 90 jours et
 * s'arretait a per_page=100 sans suivre la pagination : au-dela de 100 commits
 * sur la fenetre (comparatif-mode en est a 99), le compte partait a la baisse
 * sans la moindre erreur.
 */
async function fetchAddedDates({ repo, articlesPath }, days) {
  const paths = normalizePaths(articlesPath);
  const since = isoDaysAgo(days);
  const commits = [];
  for (const p of paths) {
    for (let page = 1; page <= 10; page++) {
      const batch = await ghFetch(
        `/repos/${repo}/commits?since=${since}&path=${encodeURIComponent(p)}&per_page=100&page=${page}`
      );
      commits.push(...batch);
      if (batch.length < 100) break;
    }
  }

  // Un meme commit peut toucher plusieurs paths suivis.
  const shas = [...new Set(commits.map(c => c.sha))];
  const addedAt = new Map();
  for (const sha of shas) {
    let details;
    try {
      details = await ghFetch(`/repos/${repo}/commits/${sha}`);
    } catch {
      continue;
    }
    const when = new Date(
      details.commit?.committer?.date ?? details.commit?.author?.date ?? Date.now()
    );
    for (const f of details.files ?? []) {
      const name = f.filename ?? '';
      if (f.status !== 'added' || !isArticle(name, paths)) continue;
      // Un article ajoute, supprime puis reajoute compte a sa premiere date.
      const prev = addedAt.get(name);
      if (!prev || when < prev) addedAt.set(name, when);
    }
  }
  return addedAt;
}

export async function fetchArticlesWindows({ repo, articlesPath }) {
  const paths = normalizePaths(articlesPath);
  if (!repo || !paths.length) {
    return { '7': 0, '28': 0, '90': 0, total: null, noRepo: true };
  }

  const [{ total, error: totalError }, addedResult] = await Promise.all([
    fetchArticlesTotal({ repo, articlesPath }),
    fetchAddedDates({ repo, articlesPath }, 90).then(
      m => ({ map: m }),
      err => ({ map: new Map(), error: err.message })
    ),
  ]);

  const addedAt = addedResult.map;
  const countSince = n => {
    const floor = new Date(isoDaysAgo(n));
    let c = 0;
    for (const d of addedAt.values()) if (d >= floor) c++;
    return c;
  };

  return {
    '7': countSince(7),
    '28': countSince(28),
    '90': countSince(90),
    total,
    error: addedResult.error || totalError,
  };
}
