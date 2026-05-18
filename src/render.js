function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function fmtNum(n) {
  if (n == null || Number.isNaN(n)) return '0';
  if (n >= 1000) return new Intl.NumberFormat('fr-FR').format(Math.round(n));
  return String(Math.round(n));
}

function fmtPosition(p) {
  if (p == null || !Number.isFinite(p) || p === 0) return '-';
  return p.toFixed(1);
}

function deltaPct(curr, prev) {
  if (!prev || prev === 0) {
    return curr > 0 ? { label: 'new', sign: 'up', value: null } : { label: '-', sign: 'flat', value: null };
  }
  const pct = ((curr - prev) / prev) * 100;
  if (Math.abs(pct) < 0.5) return { label: '0%', sign: 'flat', value: 0 };
  const sign = pct > 0 ? 'up' : 'down';
  const arrow = pct > 0 ? '↑' : '↓';
  return { label: `${arrow} ${Math.abs(pct).toFixed(0)}%`, sign, value: pct };
}

function deltaPosition(curr, prev) {
  // Pour la position, baisse = meilleure (sign inverse)
  if (prev == null || !Number.isFinite(prev) || prev === 0) {
    return { label: '-', sign: 'flat' };
  }
  if (curr == null || !Number.isFinite(curr) || curr === 0) {
    return { label: '-', sign: 'flat' };
  }
  const diff = curr - prev;
  if (Math.abs(diff) < 0.1) return { label: '0', sign: 'flat' };
  const arrow = diff < 0 ? '↑' : '↓';
  const sign = diff < 0 ? 'up' : 'down';
  return { label: `${arrow} ${Math.abs(diff).toFixed(1)}`, sign };
}

function deltaClasses(sign, kind = 'normal') {
  // kind 'normal': up = vert, down = rouge
  // kind 'position': deja inverse en amont, on mappe identique
  if (sign === 'up') return 'text-emerald-400';
  if (sign === 'down') return 'text-rose-400';
  return 'text-slate-500';
}

function renderTopPages(pages, domain) {
  if (!pages || !pages.length) {
    return '<p class="text-sm text-slate-500 italic">Aucune donnee top pages.</p>';
  }
  const rows = pages.slice(0, 10).map(p => {
    const d = deltaPct(p.clicks, p.prevClicks);
    const path = p.url.replace(`https://${domain}`, '').replace(`https://www.${domain}`, '') || '/';
    return `
      <li class="flex items-center justify-between gap-2 py-1 text-sm border-b border-slate-800 last:border-0">
        <a href="${escapeHtml(p.url)}" target="_blank" rel="noopener" class="truncate text-slate-300 hover:text-white" title="${escapeHtml(p.url)}">${escapeHtml(path)}</a>
        <span class="shrink-0 flex items-center gap-2">
          <span class="text-slate-200 font-medium tabular-nums">${fmtNum(p.clicks)}</span>
          <span class="text-xs tabular-nums ${deltaClasses(d.sign)} w-14 text-right">${d.label}</span>
        </span>
      </li>`;
  }).join('');
  return `<ul class="space-y-0">${rows}</ul>`;
}

function renderSiteCard(site, data) {
  if (data.error) {
    return `
      <article class="rounded-2xl bg-slate-900 border border-rose-900/50 p-5">
        <header class="flex items-center justify-between mb-3">
          <a href="https://${escapeHtml(site.domain)}" target="_blank" rel="noopener" class="text-lg font-semibold text-white hover:underline">${escapeHtml(site.domain)}</a>
        </header>
        <p class="text-sm text-rose-400">Erreur: ${escapeHtml(data.error)}</p>
        <p class="text-xs text-slate-500 mt-2">Verifier que la propriete <code class="text-slate-400">${escapeHtml(site.gscProperty)}</code> existe dans Search Console et que le compte connecte y a acces.</p>
      </article>`;
  }

  const dClicks = deltaPct(data.current.clicks, data.previous.clicks);
  const dImpressions = deltaPct(data.current.impressions, data.previous.impressions);
  const dPosition = deltaPosition(data.current.position, data.previous.position);

  return `
    <article class="rounded-2xl bg-slate-900 border border-slate-800 p-5 flex flex-col gap-4 hover:border-slate-700 transition-colors">
      <header class="flex items-center justify-between">
        <a href="https://${escapeHtml(site.domain)}" target="_blank" rel="noopener" class="text-lg font-semibold text-white hover:underline truncate">${escapeHtml(site.domain)}</a>
        <a href="https://github.com/${escapeHtml(site.repo)}" target="_blank" rel="noopener" class="text-xs text-slate-500 hover:text-slate-300 shrink-0" title="Repo GitHub">repo</a>
      </header>

      <div class="grid grid-cols-2 gap-3">
        <div class="rounded-lg bg-slate-950/50 p-3">
          <div class="text-xs uppercase tracking-wider text-slate-500 mb-1">Clics</div>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl font-bold text-white tabular-nums">${fmtNum(data.current.clicks)}</span>
            <span class="text-xs tabular-nums ${deltaClasses(dClicks.sign)}">${dClicks.label}</span>
          </div>
        </div>
        <div class="rounded-lg bg-slate-950/50 p-3">
          <div class="text-xs uppercase tracking-wider text-slate-500 mb-1">Impressions</div>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl font-bold text-white tabular-nums">${fmtNum(data.current.impressions)}</span>
            <span class="text-xs tabular-nums ${deltaClasses(dImpressions.sign)}">${dImpressions.label}</span>
          </div>
        </div>
        <div class="rounded-lg bg-slate-950/50 p-3">
          <div class="text-xs uppercase tracking-wider text-slate-500 mb-1">Position moy.</div>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl font-bold text-white tabular-nums">${fmtPosition(data.current.position)}</span>
            <span class="text-xs tabular-nums ${deltaClasses(dPosition.sign)}">${dPosition.label}</span>
          </div>
        </div>
        <div class="rounded-lg bg-slate-950/50 p-3">
          <div class="text-xs uppercase tracking-wider text-slate-500 mb-1">Articles 7j</div>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl font-bold text-white tabular-nums">${fmtNum(data.articlesCount)}</span>
            ${data.articlesError ? '<span class="text-xs text-rose-400" title="' + escapeHtml(data.articlesError) + '">err</span>' : ''}
          </div>
        </div>
      </div>

      <div>
        <h3 class="text-xs uppercase tracking-wider text-slate-500 mb-2">Top pages (clics, vs S-1)</h3>
        ${renderTopPages(data.topPages, site.domain)}
      </div>
    </article>`;
}

export function renderDashboard({ sitesData, generatedAt, period }) {
  const cards = sitesData.map(({ site, data }) => renderSiteCard(site, data)).join('\n');
  const updatedAt = new Date(generatedAt).toLocaleString('fr-FR', { timeZone: 'Europe/Paris', dateStyle: 'medium', timeStyle: 'short' });

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>PBN Dashboard</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; }
  </style>
</head>
<body class="bg-slate-950 text-slate-200 min-h-screen">
  <main class="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
    <header class="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-white">PBN Dashboard</h1>
        <p class="text-sm text-slate-400 mt-1">Periode: <span class="text-slate-300">${period.startDate} a ${period.endDate}</span> (vs 7 jours precedents)</p>
      </div>
      <div class="text-xs text-slate-500">MAJ ${escapeHtml(updatedAt)}</div>
    </header>

    <section class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
      ${cards}
    </section>

    <footer class="mt-12 text-center text-xs text-slate-600">
      Donnees Search Console + GitHub Commits | <a class="hover:text-slate-400" href="https://github.com/analytics-ds/pbn-dashboard">analytics-ds/pbn-dashboard</a>
    </footer>
  </main>
</body>
</html>
`;
}
