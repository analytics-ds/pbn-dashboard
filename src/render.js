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
    return curr > 0 ? { label: 'new', sign: 'up' } : { label: null, sign: 'flat' };
  }
  const pct = ((curr - prev) / prev) * 100;
  if (Math.abs(pct) < 0.5) return { label: '0%', sign: 'flat' };
  const sign = pct > 0 ? 'up' : 'down';
  const arrow = pct > 0 ? '+' : '';
  return { label: `${arrow}${pct.toFixed(0)}%`, sign };
}

function deltaPosition(curr, prev) {
  if (prev == null || !Number.isFinite(prev) || prev === 0) return { label: null, sign: 'flat' };
  if (curr == null || !Number.isFinite(curr) || curr === 0) return { label: null, sign: 'flat' };
  const diff = curr - prev;
  if (Math.abs(diff) < 0.1) return { label: '0', sign: 'flat' };
  const sign = diff < 0 ? 'up' : 'down';
  return { label: `${diff > 0 ? '+' : ''}${diff.toFixed(1)}`, sign };
}

function badge(sign, label) {
  if (!label) return '';
  const cls = sign === 'up'
    ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/10'
    : sign === 'down'
      ? 'bg-rose-50 text-rose-700 ring-rose-600/10'
      : 'bg-slate-100 text-slate-600 ring-slate-500/10';
  const icon = sign === 'up'
    ? '<svg class="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z" clip-rule="evenodd"/></svg>'
    : sign === 'down'
      ? '<svg class="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z" clip-rule="evenodd"/></svg>'
      : '';
  return `<span class="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}">${icon}${escapeHtml(label)}</span>`;
}

function kpi(label, value, deltaInfo, iconSvg) {
  return `
    <div>
      <div class="flex items-center gap-1.5 text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
        ${iconSvg || ''}<span>${label}</span>
      </div>
      <div class="flex items-baseline gap-2">
        <span class="text-2xl font-semibold text-slate-900 tabular-nums tracking-tight">${value}</span>
        ${deltaInfo ? badge(deltaInfo.sign, deltaInfo.label) : ''}
      </div>
    </div>`;
}

const ICON_CLICK = '<svg class="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6.5 6.5l11 11M21 21l-5.6-5.6M15 21l-4-4M21 15l-4-4"/><path d="M9.5 17.5L12 15l-4-7-7 4 7 4-2.5 2.5z"/></svg>';
const ICON_EYE = '<svg class="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>';
const ICON_POS = '<svg class="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h4l3-9 4 18 3-9h4"/></svg>';
const ICON_DOC = '<svg class="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>';

function renderTopPages(pages, domain) {
  if (!pages || !pages.length) {
    return '<div class="text-sm text-slate-400 italic px-4 py-6 text-center">Aucune page avec donnees</div>';
  }
  const rows = pages.slice(0, 10).map((p, i) => {
    const d = deltaPct(p.clicks, p.prevClicks);
    const path = p.url.replace(`https://${domain}`, '').replace(`https://www.${domain}`, '') || '/';
    return `
      <div class="group flex items-center justify-between gap-3 px-4 py-2 hover:bg-slate-50 transition-colors">
        <div class="flex items-center gap-3 min-w-0 flex-1">
          <span class="text-xs text-slate-400 tabular-nums w-4">${i + 1}</span>
          <a href="${escapeHtml(p.url)}" target="_blank" rel="noopener" class="truncate text-sm text-slate-700 group-hover:text-slate-900" title="${escapeHtml(p.url)}">${escapeHtml(path)}</a>
        </div>
        <div class="shrink-0 flex items-center gap-2.5">
          <span class="text-sm font-medium text-slate-900 tabular-nums w-10 text-right">${fmtNum(p.clicks)}</span>
          <span class="w-14 flex justify-end">${badge(d.sign, d.label)}</span>
        </div>
      </div>`;
  }).join('');
  return `<div class="divide-y divide-slate-100">${rows}</div>`;
}

function renderSiteCard(site, data) {
  if (data.error) {
    return `
      <article class="rounded-2xl bg-white ring-1 ring-rose-200/60 shadow-sm overflow-hidden">
        <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <a href="https://${escapeHtml(site.domain)}" target="_blank" rel="noopener" class="text-base font-semibold text-slate-900 hover:text-indigo-600 truncate">${escapeHtml(site.domain)}</a>
          <span class="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-600/10">Erreur</span>
        </div>
        <div class="px-6 py-5 text-sm text-slate-600">
          <p class="mb-2">${escapeHtml(data.error)}</p>
          <p class="text-xs text-slate-400">Propriete attendue&nbsp;: <code class="font-mono text-slate-500">${escapeHtml(site.gscProperty)}</code></p>
        </div>
      </article>`;
  }

  const dClicks = deltaPct(data.current.clicks, data.previous.clicks);
  const dImpressions = deltaPct(data.current.impressions, data.previous.impressions);
  const dPosition = deltaPosition(data.current.position, data.previous.position);

  return `
    <article class="rounded-2xl bg-white ring-1 ring-slate-200/70 shadow-sm overflow-hidden hover:shadow-md hover:ring-slate-300/70 transition-all">
      <header class="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <div class="flex items-center gap-2 min-w-0">
          <img src="https://www.google.com/s2/favicons?domain=${escapeHtml(site.domain)}&sz=32" alt="" class="w-5 h-5 rounded shrink-0" loading="lazy">
          <a href="https://${escapeHtml(site.domain)}" target="_blank" rel="noopener" class="text-base font-semibold text-slate-900 hover:text-indigo-600 truncate">${escapeHtml(site.domain)}</a>
        </div>
        <a href="https://github.com/${escapeHtml(site.repo)}" target="_blank" rel="noopener" class="text-xs text-slate-400 hover:text-slate-600 shrink-0 inline-flex items-center gap-1" title="Repo GitHub">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.4 3-.405 1.02.005 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
        </a>
      </header>

      <div class="px-6 py-5 grid grid-cols-2 gap-x-6 gap-y-5">
        ${kpi('Clics', fmtNum(data.current.clicks), dClicks, ICON_CLICK)}
        ${kpi('Impressions', fmtNum(data.current.impressions), dImpressions, ICON_EYE)}
        ${kpi('Position moy.', fmtPosition(data.current.position), dPosition, ICON_POS)}
        ${kpi('Articles 7j', fmtNum(data.articlesCount), null, ICON_DOC)}
      </div>

      <div class="border-t border-slate-100">
        <div class="px-6 pt-4 pb-2 flex items-center justify-between">
          <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wide">Top pages</h3>
          <span class="text-xs text-slate-400">Clics &middot; vs S-1</span>
        </div>
        ${renderTopPages(data.topPages, site.domain)}
      </div>
    </article>`;
}

function renderSummary(sitesData) {
  const ok = sitesData.filter(s => !s.data.error);
  const totals = ok.reduce((acc, s) => {
    acc.clicks += s.data.current?.clicks ?? 0;
    acc.impressions += s.data.current?.impressions ?? 0;
    acc.articles += s.data.articlesCount ?? 0;
    return acc;
  }, { clicks: 0, impressions: 0, articles: 0 });
  const prevTotals = ok.reduce((acc, s) => {
    acc.clicks += s.data.previous?.clicks ?? 0;
    acc.impressions += s.data.previous?.impressions ?? 0;
    return acc;
  }, { clicks: 0, impressions: 0 });

  const dClicks = deltaPct(totals.clicks, prevTotals.clicks);
  const dImpressions = deltaPct(totals.impressions, prevTotals.impressions);

  const card = (label, value, delta, iconSvg) => `
    <div class="rounded-2xl bg-white ring-1 ring-slate-200/70 shadow-sm p-5">
      <div class="flex items-center gap-1.5 text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
        ${iconSvg}<span>${label}</span>
      </div>
      <div class="flex items-baseline gap-2">
        <span class="text-3xl font-bold text-slate-900 tabular-nums tracking-tight">${value}</span>
        ${delta ? badge(delta.sign, delta.label) : ''}
      </div>
    </div>`;

  return `
    <section class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      ${card('Clics 7j', fmtNum(totals.clicks), dClicks, ICON_CLICK)}
      ${card('Impressions 7j', fmtNum(totals.impressions), dImpressions, ICON_EYE)}
      ${card('Articles publies', fmtNum(totals.articles), null, ICON_DOC)}
      ${card('Sites actifs', `${ok.length}<span class="text-lg text-slate-400">/${sitesData.length}</span>`, null, '<svg class="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>')}
    </section>`;
}

export function renderDashboard({ sitesData, generatedAt, period }) {
  const cards = sitesData.map(({ site, data }) => renderSiteCard(site, data)).join('\n');
  const summary = renderSummary(sitesData);
  const updatedAt = new Date(generatedAt).toLocaleString('fr-FR', { timeZone: 'Europe/Paris', dateStyle: 'medium', timeStyle: 'short' });

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>PBN Dashboard</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: { sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'] },
        }
      }
    };
  </script>
  <style>
    html, body { font-family: 'Inter', system-ui, -apple-system, sans-serif; -webkit-font-smoothing: antialiased; }
  </style>
</head>
<body class="bg-slate-50 text-slate-900 min-h-screen antialiased">
  <header class="bg-white border-b border-slate-200/70 sticky top-0 z-10 backdrop-blur-sm bg-white/95">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 3v18h18"/><path d="M7 14l4-4 4 4 5-5"/></svg>
        </div>
        <div>
          <h1 class="text-base font-bold text-slate-900 leading-tight">PBN Dashboard</h1>
          <p class="text-xs text-slate-500">Performance Search Console &middot; ${sitesData.length} sites</p>
        </div>
      </div>
      <div class="hidden sm:flex items-center gap-2 text-xs text-slate-500">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/><path d="M12 8v4l3 2"/></svg>
        <span>MAJ ${escapeHtml(updatedAt)}</span>
      </div>
    </div>
  </header>

  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-slate-900 tracking-tight">Vue d'ensemble</h2>
      <p class="text-sm text-slate-500 mt-1">Periode du <span class="font-medium text-slate-700">${period.startDate}</span> au <span class="font-medium text-slate-700">${period.endDate}</span> &middot; comparaison vs 7 jours precedents</p>
    </div>

    ${summary}

    <div class="mb-4">
      <h2 class="text-lg font-semibold text-slate-900">Sites</h2>
    </div>

    <section class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      ${cards}
    </section>

    <footer class="mt-12 pt-6 border-t border-slate-200 text-center text-xs text-slate-400">
      Donnees Search Console + GitHub Commits &middot; <a class="hover:text-slate-600 underline-offset-2 hover:underline" href="https://github.com/analytics-ds/pbn-dashboard" target="_blank" rel="noopener">analytics-ds/pbn-dashboard</a>
    </footer>
  </main>
</body>
</html>
`;
}
