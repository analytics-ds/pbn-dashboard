function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderDashboard({ sitesData, generatedAt, periods }) {
  const payload = {
    generatedAt,
    periods,
    sites: sitesData.map(({ site, data }) => ({
      domain: site.domain,
      repo: site.repo,
      gscProperty: site.gscProperty,
      data,
    })),
  };
  const json = JSON.stringify(payload).replace(/</g, '\\u003c');
  const updatedAt = new Date(generatedAt).toLocaleString('fr-FR', { timeZone: 'Europe/Paris', dateStyle: 'medium', timeStyle: 'short' });

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>PBN Dashboard</title>
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%231A1A1A'/%3E%3Cpath d='M8 8v16h16M11 19l4-4 4 4 5-5' stroke='%23C2B642' stroke-width='2.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #FAFAF7; --bg-warm: #F2F0EB; --bg-card: #FFFFFF;
      --bg-olive: #C2B642; --bg-olive-light: #E8E4A0;
      --bg-black: #1A1A1A; --bg-dark: #2C2C2C;
      --border: #E5E3DE; --border-strong: #D0CEC7;
      --text: #1A1A1A; --text-secondary: #6B6B60; --text-muted: #9C9C90;
      --accent: #C2B642; --accent-dark: #9A8F30;
      --green: #2D8C5A; --green-bg: #E8F5EE;
      --red: #C94040; --red-bg: #FDE8E8;
      --blue: #4A90D9; --blue-bg: #E8F0FA;
      --purple: #7B61FF; --purple-bg: #F0EDFF;
      --shadow-sm: 0 1px 3px rgba(0,0,0,0.04); --shadow: 0 2px 12px rgba(0,0,0,0.06); --shadow-lg: 0 8px 32px rgba(0,0,0,0.08);
      --radius: 16px; --radius-sm: 10px; --radius-xs: 6px; --radius-pill: 100px;
    }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body { font-family: 'Inter', system-ui, -apple-system, sans-serif; background: var(--bg); color: var(--text); -webkit-font-smoothing: antialiased; font-size: 14px; line-height: 1.5; }
    a { color: inherit; text-decoration: none; }
    button { font-family: inherit; cursor: pointer; border: 0; background: transparent; padding: 0; color: inherit; }
    code { font-family: ui-monospace, monospace; font-size: 0.85em; }

    .app { display: grid; grid-template-columns: 260px 1fr; min-height: 100vh; }

    /* Sidebar */
    .sidebar { background: var(--bg-card); border-right: 1px solid var(--border); display: flex; flex-direction: column; position: sticky; top: 0; height: 100vh; overflow: hidden; }
    .sidebar-brand { padding: 22px 20px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid var(--border); }
    .brand-logo { width: 36px; height: 36px; border-radius: 10px; background: var(--bg-black); display: flex; align-items: center; justify-content: center; color: var(--accent); }
    .brand-text h1 { margin: 0; font-size: 15px; font-weight: 700; letter-spacing: -0.01em; }
    .brand-text p { margin: 0; font-size: 11px; color: var(--text-muted); }
    .sidebar-section { padding: 12px 12px 4px; font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .sidebar-nav { flex: 1; overflow-y: auto; padding: 0 8px 16px; }
    .nav-item { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: var(--radius-sm); color: var(--text-secondary); font-weight: 500; font-size: 13px; transition: background 0.15s; cursor: pointer; margin-bottom: 1px; }
    .nav-item:hover { background: var(--bg-warm); color: var(--text); }
    .nav-item.active { background: var(--bg-black); color: var(--bg-card); }
    .nav-favicon { width: 18px; height: 18px; border-radius: 4px; flex-shrink: 0; }
    .nav-icon { width: 18px; height: 18px; flex-shrink: 0; opacity: 0.7; }
    .nav-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .nav-badge { font-size: 11px; padding: 2px 7px; background: var(--red-bg); color: var(--red); border-radius: var(--radius-pill); font-weight: 600; }
    .nav-item.active .nav-badge { background: rgba(255,255,255,0.15); color: var(--bg-card); }
    .sidebar-footer { padding: 12px 16px; border-top: 1px solid var(--border); font-size: 11px; color: var(--text-muted); }
    .sidebar-footer a { color: var(--text-secondary); }

    /* Main */
    .main { background: var(--bg); min-width: 0; }
    .topbar { background: var(--bg-card); border-bottom: 1px solid var(--border); padding: 18px 32px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 5; gap: 16px; flex-wrap: wrap; }
    .topbar h2 { margin: 0; font-size: 18px; font-weight: 700; letter-spacing: -0.01em; }
    .topbar-meta { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
    .topbar-actions { display: flex; align-items: center; gap: 10px; }

    .switch { display: flex; background: var(--bg-warm); border-radius: var(--radius-pill); padding: 3px; gap: 2px; }
    .switch button { padding: 7px 14px; border-radius: var(--radius-pill); font-size: 12px; font-weight: 600; color: var(--text-secondary); transition: all 0.15s; display: inline-flex; align-items: center; gap: 6px; }
    .switch button:hover { color: var(--text); }
    .switch button.active { background: var(--bg-card); color: var(--text); box-shadow: var(--shadow-sm); }
    .switch button svg { width: 14px; height: 14px; }

    .btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: var(--radius-pill); font-size: 12px; font-weight: 600; color: var(--text-secondary); border: 1px solid var(--border); background: var(--bg-card); cursor: pointer; transition: all 0.15s; }
    .btn:hover { background: var(--bg-warm); color: var(--text); border-color: var(--border-strong); }
    .btn svg { width: 14px; height: 14px; }
    .btn.primary { background: var(--bg-black); color: var(--bg-card); border-color: var(--bg-black); }
    .btn.primary:hover { background: var(--bg-dark); }

    .country-wrap { position: relative; display: inline-flex; align-items: center; }
    .country-wrap .country-icon { position: absolute; left: 12px; width: 14px; height: 14px; color: var(--text-muted); pointer-events: none; }
    #country-select { appearance: none; -webkit-appearance: none; padding: 8px 30px 8px 32px; font-size: 12px; font-weight: 600; color: var(--text-secondary); background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-pill); cursor: pointer; font-family: inherit; }
    #country-select:hover { color: var(--text); border-color: var(--border-strong); }
    .country-wrap::after { content: '▾'; position: absolute; right: 12px; pointer-events: none; color: var(--text-muted); font-size: 10px; }

    .content { padding: 28px 32px; max-width: 1400px; margin: 0 auto; }

    /* KPI cards */
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
    .kpi-card { background: var(--bg-card); border-radius: var(--radius); padding: 20px; border: 1px solid var(--border); }
    .kpi-card .label { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px; }
    .kpi-card .label svg { width: 14px; height: 14px; }
    .kpi-card .value { display: flex; align-items: baseline; gap: 10px; }
    .kpi-card .value .num { font-size: 28px; font-weight: 700; letter-spacing: -0.02em; color: var(--text); font-variant-numeric: tabular-nums; }
    .kpi-card .value .sub { font-size: 16px; color: var(--text-muted); font-weight: 600; }

    .badge { display: inline-flex; align-items: center; gap: 3px; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: var(--radius-pill); font-variant-numeric: tabular-nums; }
    .badge svg { width: 10px; height: 10px; }
    .badge.up { background: var(--green-bg); color: var(--green); }
    .badge.down { background: var(--red-bg); color: var(--red); }
    .badge.flat { background: var(--bg-warm); color: var(--text-muted); }

    .section-title { font-size: 13px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; margin: 28px 0 14px; display: flex; align-items: center; justify-content: space-between; }
    .section-title:first-child { margin-top: 0; }
    .section-title .hint { font-size: 11px; color: var(--text-muted); font-weight: 500; text-transform: none; letter-spacing: 0; }

    /* Trending */
    .trending-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 28px; }
    .trending-card { background: var(--bg-card); border-radius: var(--radius); border: 1px solid var(--border); overflow: hidden; }
    .trending-card .head { padding: 14px 18px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 13px; }
    .trending-card .head .dot { width: 8px; height: 8px; border-radius: 50%; }
    .trending-card.up .head .dot { background: var(--green); }
    .trending-card.down .head .dot { background: var(--red); }
    .trending-row { padding: 9px 18px; border-bottom: 1px solid var(--border); display: grid; grid-template-columns: 1fr auto auto; gap: 10px; align-items: center; transition: background 0.1s; }
    .trending-row:last-child { border-bottom: 0; }
    .trending-row:hover { background: var(--bg-warm); }
    .trending-url { min-width: 0; }
    .trending-url .site { font-size: 11px; color: var(--text-muted); font-weight: 500; }
    .trending-url .path { font-size: 12px; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .trending-row:hover .trending-url .path { color: var(--text); }
    .trending-row .clicks { font-weight: 600; font-size: 12px; font-variant-numeric: tabular-nums; color: var(--text); min-width: 36px; text-align: right; }
    @media (max-width: 1100px) { .trending-grid { grid-template-columns: 1fr; } }

    /* Site grid */
    .sites-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 16px; }
    .site-card { background: var(--bg-card); border-radius: var(--radius); border: 1px solid var(--border); padding: 18px; cursor: pointer; transition: all 0.15s; display: flex; flex-direction: column; gap: 14px; }
    .site-card:hover { border-color: var(--border-strong); box-shadow: var(--shadow); transform: translateY(-1px); }
    .site-card .head { display: flex; align-items: center; gap: 10px; }
    .site-card .head .favicon { width: 22px; height: 22px; border-radius: 5px; flex-shrink: 0; }
    .site-card .head .domain { font-weight: 600; font-size: 14px; color: var(--text); flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .site-card .head .arrow { color: var(--text-muted); flex-shrink: 0; transition: transform 0.15s, color 0.15s; }
    .site-card:hover .arrow { transform: translateX(3px); color: var(--accent-dark); }
    .site-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
    .site-kpi { display: flex; flex-direction: column; gap: 2px; }
    .site-kpi .label { font-size: 10px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
    .site-kpi .num { font-size: 18px; font-weight: 700; color: var(--text); font-variant-numeric: tabular-nums; }
    .site-kpi .delta { margin-top: 2px; }
    .site-sparkline { height: 36px; margin: 0 -4px; position: relative; }
    .site-error { background: var(--bg-card); border-radius: var(--radius); border: 1px solid var(--red); padding: 18px; cursor: not-allowed; }
    .site-error .err-tag { font-size: 11px; font-weight: 600; background: var(--red-bg); color: var(--red); padding: 3px 10px; border-radius: var(--radius-pill); }
    .site-error .err-msg { font-size: 12px; color: var(--text-secondary); margin-top: 8px; line-height: 1.45; }

    /* Detail view */
    .detail-head { background: var(--bg-card); border-radius: var(--radius); border: 1px solid var(--border); padding: 22px 24px; margin-bottom: 20px; display: flex; align-items: center; gap: 16px; }
    .detail-head .favicon { width: 40px; height: 40px; border-radius: 10px; }
    .detail-head .info { flex: 1; }
    .detail-head .info h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.01em; }
    .detail-head .info .links { display: flex; gap: 14px; margin-top: 4px; font-size: 12px; flex-wrap: wrap; }
    .detail-head .info .links a, .detail-head .info .links span { color: var(--text-muted); display: inline-flex; align-items: center; gap: 4px; }
    .detail-head .info .links a:hover { color: var(--accent-dark); }
    .detail-head .info .links svg { width: 13px; height: 13px; }

    .chart-card { background: var(--bg-card); border-radius: var(--radius); border: 1px solid var(--border); padding: 20px; margin-bottom: 20px; }
    .chart-card h3 { margin: 0 0 4px; font-size: 14px; font-weight: 600; }
    .chart-card .chart-sub { font-size: 12px; color: var(--text-muted); margin-bottom: 16px; }
    .chart-wrap { height: 220px; position: relative; }
    .chart-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    @media (max-width: 1100px) { .chart-grid { grid-template-columns: 1fr; } }

    /* Data table (pages or queries) */
    .data-table { background: var(--bg-card); border-radius: var(--radius); border: 1px solid var(--border); overflow: hidden; }
    .data-table .head { padding: 14px 20px; display: flex; gap: 12px; align-items: center; border-bottom: 1px solid var(--border); flex-wrap: wrap; }
    .data-table .tabs { display: flex; gap: 4px; }
    .tab-btn { padding: 7px 14px; border-radius: var(--radius-sm); font-size: 12px; font-weight: 600; color: var(--text-secondary); background: var(--bg-warm); transition: all 0.15s; }
    .tab-btn:hover { color: var(--text); }
    .tab-btn.active { background: var(--bg-black); color: var(--bg-card); }
    .data-table .count { font-size: 11px; color: var(--text-muted); font-weight: 500; }
    .data-table .search { margin-left: auto; position: relative; }
    .data-table .search input { width: 220px; padding: 7px 12px 7px 32px; font-size: 12px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--bg); color: var(--text); outline: none; font-family: inherit; }
    .data-table .search input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(194,182,66,0.15); background: var(--bg-card); }
    .data-table .search svg { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); width: 14px; height: 14px; color: var(--text-muted); pointer-events: none; }
    .data-cols, .data-row { display: grid; gap: 10px; padding: 10px 20px; align-items: center; }
    .data-cols { font-size: 10px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; background: var(--bg); border-bottom: 1px solid var(--border); }
    .data-cols.pages, .data-row.pages { grid-template-columns: 40px minmax(0, 1fr) 60px 60px 70px 60px 60px 60px; }
    .data-cols.queries, .data-row.queries { grid-template-columns: 40px minmax(0, 1fr) 60px 60px 70px 60px 60px 60px; }
    .data-cols .right { text-align: right; }
    .data-row { border-bottom: 1px solid var(--border); transition: background 0.1s; }
    .data-row:last-child { border-bottom: 0; }
    .data-row:hover { background: var(--bg-warm); }
    .data-row .rank { color: var(--text-muted); font-size: 12px; font-variant-numeric: tabular-nums; }
    .data-row .url, .data-row .qtext { color: var(--text-secondary); font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .data-row:hover .url, .data-row:hover .qtext { color: var(--text); }
    .data-row .num { font-weight: 600; font-size: 13px; font-variant-numeric: tabular-nums; text-align: right; color: var(--text); }
    .data-row .num-light { font-weight: 500; font-size: 13px; font-variant-numeric: tabular-nums; text-align: right; color: var(--text-secondary); }
    .data-row .delta-cell { text-align: right; }
    .pagination { padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); background: var(--bg); }
    .pagination .info { font-size: 12px; color: var(--text-muted); }
    .pagination .pager { display: flex; gap: 4px; align-items: center; }
    .pager-btn { min-width: 32px; height: 32px; padding: 0 10px; border-radius: var(--radius-sm); font-size: 12px; font-weight: 500; color: var(--text-secondary); background: var(--bg-card); border: 1px solid var(--border); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
    .pager-btn:hover:not(:disabled) { background: var(--bg-warm); color: var(--text); border-color: var(--border-strong); }
    .pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .pager-btn.active { background: var(--bg-black); color: var(--bg-card); border-color: var(--bg-black); }
    .pager-ellipsis { padding: 0 4px; color: var(--text-muted); font-size: 12px; }
    .empty-state { padding: 40px; text-align: center; color: var(--text-muted); font-size: 13px; }

    /* Comparison view */
    .compare-table { background: var(--bg-card); border-radius: var(--radius); border: 1px solid var(--border); overflow: hidden; }
    .compare-table table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .compare-table th { background: var(--bg); padding: 12px 16px; text-align: left; font-size: 10px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border); cursor: pointer; user-select: none; white-space: nowrap; }
    .compare-table th.right { text-align: right; }
    .compare-table th:hover { color: var(--text); }
    .compare-table th .sort-arrow { display: inline-block; margin-left: 4px; opacity: 0.5; }
    .compare-table th.sorted { color: var(--text); }
    .compare-table th.sorted .sort-arrow { opacity: 1; }
    .compare-table td { padding: 14px 16px; border-bottom: 1px solid var(--border); font-variant-numeric: tabular-nums; }
    .compare-table tr:last-child td { border-bottom: 0; }
    .compare-table tr:hover { background: var(--bg-warm); cursor: pointer; }
    .compare-table td.right { text-align: right; font-weight: 600; }
    .compare-table .site-cell { display: flex; align-items: center; gap: 8px; min-width: 200px; }
    .compare-table .site-cell img { width: 18px; height: 18px; border-radius: 4px; }

    @media (max-width: 900px) {
      .app { grid-template-columns: 1fr; }
      .sidebar { position: relative; height: auto; max-height: 50vh; }
      .content { padding: 20px 16px; }
      .topbar { padding: 14px 16px; }
      .kpi-grid { grid-template-columns: repeat(2, 1fr); }
      .sites-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="app">
    <aside class="sidebar">
      <div class="sidebar-brand">
        <div class="brand-logo">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 14l4-4 4 4 5-5"/></svg>
        </div>
        <div class="brand-text">
          <h1>PBN Dashboard</h1>
          <p>Search Console &middot; ${updatedAt}</p>
        </div>
      </div>
      <div class="sidebar-section">Vues</div>
      <nav class="sidebar-nav" id="nav"></nav>
      <div class="sidebar-footer">
        <a href="https://github.com/analytics-ds/pbn-dashboard" target="_blank" rel="noopener">analytics-ds/pbn-dashboard</a>
      </div>
    </aside>

    <main class="main">
      <div class="topbar">
        <div>
          <h2 id="page-title">Vue d'ensemble</h2>
          <div class="topbar-meta" id="page-sub"></div>
        </div>
        <div class="topbar-actions">
          <div class="switch" id="device-switch">
            <button class="active" data-device="all"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>Tous</button>
            <button data-device="desktop"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>Desktop</button>
            <button data-device="mobile"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h0"/></svg>Mobile</button>
          </div>
          <div class="country-wrap">
            <svg class="country-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 010 20M12 2a15 15 0 000 20"/></svg>
            <select id="country-select"><option value="all">Tous pays</option></select>
          </div>
          <div class="switch" id="period-switch">
            <button data-period="7">7j</button>
            <button class="active" data-period="28">28j</button>
            <button data-period="90">90j</button>
          </div>
        </div>
      </div>
      <div class="content" id="content"></div>
    </main>
  </div>

  <script id="data" type="application/json">${json}</script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.6/dist/chart.umd.min.js"></script>
  <script>
    const PAYLOAD = JSON.parse(document.getElementById('data').textContent);
    const SITES = PAYLOAD.sites;
    let currentPeriod = '28';
    let currentDevice = 'all';
    let currentCountry = 'all';
    let currentView = 'overview';
    let charts = [];

    // ISO 3166-1 alpha-3 -> alpha-2 + nom francais
    const COUNTRY_INFO = { fra: ['fr', 'France'], usa: ['us', 'États-Unis'], gbr: ['gb', 'Royaume-Uni'], deu: ['de', 'Allemagne'], esp: ['es', 'Espagne'], ita: ['it', 'Italie'], bel: ['be', 'Belgique'], che: ['ch', 'Suisse'], can: ['ca', 'Canada'], mar: ['ma', 'Maroc'], dza: ['dz', 'Algérie'], tun: ['tn', 'Tunisie'], sen: ['sn', 'Sénégal'], civ: ['ci', 'Côte d\\'Ivoire'], cmr: ['cm', 'Cameroun'], lux: ['lu', 'Luxembourg'], prt: ['pt', 'Portugal'], nld: ['nl', 'Pays-Bas'], aut: ['at', 'Autriche'], irl: ['ie', 'Irlande'], pol: ['pl', 'Pologne'], rou: ['ro', 'Roumanie'], tur: ['tr', 'Turquie'], rus: ['ru', 'Russie'], chn: ['cn', 'Chine'], jpn: ['jp', 'Japon'], kor: ['kr', 'Corée du Sud'], ind: ['in', 'Inde'], bra: ['br', 'Brésil'], mex: ['mx', 'Mexique'], arg: ['ar', 'Argentine'], aus: ['au', 'Australie'], mco: ['mc', 'Monaco'], mlt: ['mt', 'Malte'], dnk: ['dk', 'Danemark'], swe: ['se', 'Suède'], nor: ['no', 'Norvège'], fin: ['fi', 'Finlande'], isl: ['is', 'Islande'], cze: ['cz', 'Tchéquie'], hun: ['hu', 'Hongrie'], svk: ['sk', 'Slovaquie'], svn: ['si', 'Slovénie'], hrv: ['hr', 'Croatie'], grc: ['gr', 'Grèce'], bgr: ['bg', 'Bulgarie'], srb: ['rs', 'Serbie'], ukr: ['ua', 'Ukraine'], isr: ['il', 'Israël'], are: ['ae', 'Émirats arabes unis'], sau: ['sa', 'Arabie saoudite'], mdg: ['mg', 'Madagascar'], mus: ['mu', 'Maurice'], reu: ['re', 'La Réunion'], glp: ['gp', 'Guadeloupe'], mtq: ['mq', 'Martinique'], guf: ['gf', 'Guyane'], nca: ['nc', 'Nouvelle-Calédonie'], pyf: ['pf', 'Polynésie française'] };
    function countryName(code) { return COUNTRY_INFO[code]?.[1] || code.toUpperCase(); }
    function countryFlag(code) {
      const a2 = COUNTRY_INFO[code]?.[0];
      if (!a2) return '🌐';
      return String.fromCodePoint(...a2.toUpperCase().split('').map(c => 0x1F1E6 - 65 + c.charCodeAt(0)));
    }

    // ----- Page/Query aggregation by country
    function getPagesForView(w) {
      if (!w?.pagesByCountry) return [];
      if (currentCountry === 'all') {
        const map = new Map();
        for (const p of w.pagesByCountry) {
          const e = map.get(p.url);
          if (e) {
            e._wPos += (p.position || 0) * (p.impressions || 0);
            e._wPosPrev += (p.prevPosition || 0) * (p.prevImpressions || 0);
            e.clicks += p.clicks; e.impressions += p.impressions;
            e.prevClicks += p.prevClicks; e.prevImpressions += p.prevImpressions;
          } else {
            map.set(p.url, {
              url: p.url, clicks: p.clicks, impressions: p.impressions, position: p.position,
              prevClicks: p.prevClicks, prevImpressions: p.prevImpressions, prevPosition: p.prevPosition,
              _wPos: (p.position || 0) * (p.impressions || 0),
              _wPosPrev: (p.prevPosition || 0) * (p.prevImpressions || 0),
            });
          }
        }
        const out = [...map.values()].map(p => ({
          ...p,
          position: p.impressions > 0 ? p._wPos / p.impressions : p.position,
          prevPosition: p.prevImpressions > 0 ? p._wPosPrev / p.prevImpressions : p.prevPosition,
        }));
        return out.sort((a, b) => b.clicks - a.clicks);
      }
      return w.pagesByCountry.filter(p => p.country === currentCountry).sort((a, b) => b.clicks - a.clicks);
    }

    function getQueriesForView(w) {
      if (!w?.queriesByCountry) return [];
      if (currentCountry === 'all') {
        const map = new Map();
        for (const q of w.queriesByCountry) {
          const e = map.get(q.query);
          if (e) {
            e._wPos += (q.position || 0) * (q.impressions || 0);
            e._wPosPrev += (q.prevPosition || 0) * (q.prevImpressions || 0);
            e.clicks += q.clicks; e.impressions += q.impressions;
            e.prevClicks += q.prevClicks; e.prevImpressions += q.prevImpressions;
          } else {
            map.set(q.query, {
              query: q.query, clicks: q.clicks, impressions: q.impressions, position: q.position, ctr: q.ctr,
              prevClicks: q.prevClicks, prevImpressions: q.prevImpressions, prevPosition: q.prevPosition,
              _wPos: (q.position || 0) * (q.impressions || 0),
              _wPosPrev: (q.prevPosition || 0) * (q.prevImpressions || 0),
            });
          }
        }
        const out = [...map.values()].map(q => ({
          ...q,
          position: q.impressions > 0 ? q._wPos / q.impressions : q.position,
          prevPosition: q.prevImpressions > 0 ? q._wPosPrev / q.prevImpressions : q.prevPosition,
        }));
        return out.sort((a, b) => b.clicks - a.clicks);
      }
      return w.queriesByCountry.filter(q => q.country === currentCountry).sort((a, b) => b.clicks - a.clicks);
    }

    const $ = (s, el = document) => el.querySelector(s);

    // ----- Helpers
    const fmtNum = (n) => {
      if (n == null || Number.isNaN(n)) return '0';
      if (n >= 1000) return new Intl.NumberFormat('fr-FR').format(Math.round(n));
      return String(Math.round(n));
    };
    const fmtPos = (p) => (p == null || !isFinite(p) || p === 0) ? '-' : p.toFixed(1);
    const fmtDate = (iso) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-');

    function deltaPct(curr, prev) {
      if (!prev || prev === 0) return curr > 0 ? { label: 'new', sign: 'up', raw: 100 } : null;
      const pct = ((curr - prev) / prev) * 100;
      if (Math.abs(pct) < 0.5) return { label: '0%', sign: 'flat', raw: 0 };
      return { label: (pct > 0 ? '+' : '') + pct.toFixed(0) + '%', sign: pct > 0 ? 'up' : 'down', raw: pct };
    }
    function deltaPos(curr, prev) {
      if (!prev || !isFinite(prev) || !curr || !isFinite(curr)) return null;
      const diff = curr - prev;
      if (Math.abs(diff) < 0.1) return { label: '0', sign: 'flat', raw: 0 };
      return { label: (diff > 0 ? '+' : '') + diff.toFixed(1), sign: diff < 0 ? 'up' : 'down', raw: -diff };
    }
    function badge(d) {
      if (!d || !d.label) return '';
      const arrow = d.sign === 'up'
        ? '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z"/></svg>'
        : d.sign === 'down' ? '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z"/></svg>' : '';
      return '<span class="badge ' + d.sign + '">' + arrow + d.label + '</span>';
    }
    function favicon(domain) { return 'https://www.google.com/s2/favicons?domain=' + encodeURIComponent(domain) + '&sz=64'; }
    function pathOf(url, domain) { return url.replace('https://' + domain, '').replace('https://www.' + domain, '') || '/'; }

    function getSiteWindow(site, period) { return site.data.windows?.[period]; }
    function getSiteArticles(site, period) { return site.data.articles?.[period] ?? 0; }

    // Applique filtres device + pays aux totaux (returns adjusted current/previous)
    function deviceAdjust(window) {
      if (!window || window.error) return window;
      let curr = window.current;
      let prev = window.previous;
      // Combine ratios: device * country (approximation multiplicative)
      let ratio = 1;
      if (currentDevice !== 'all' && window.devices) {
        const dev = window.devices[currentDevice];
        if (!dev) return { ...window, current: { clicks: 0, impressions: 0, position: 0, ctr: 0 }, previous: { clicks: 0, impressions: 0, position: 0, ctr: 0 } };
        const r = dev.clicks / Math.max(1, curr.clicks);
        ratio *= r;
        curr = dev;
      }
      if (currentCountry !== 'all' && window.countries) {
        const ct = window.countries[currentCountry];
        if (!ct) return { ...window, current: { clicks: 0, impressions: 0, position: 0, ctr: 0 }, previous: { clicks: 0, impressions: 0, position: 0, ctr: 0 } };
        const baseClicks = currentDevice === 'all' ? window.current.clicks : (window.devices?.[currentDevice]?.clicks ?? 0);
        const r = ct.clicks / Math.max(1, baseClicks || ct.clicks);
        if (currentDevice === 'all') {
          curr = ct;
        } else {
          // Combine: ratio pays applique a la valeur device
          curr = { clicks: Math.round(curr.clicks * r), impressions: Math.round(curr.impressions * r), position: ct.position, ctr: ct.ctr };
          ratio *= r;
        }
        if (currentDevice === 'all') ratio = ct.clicks / Math.max(1, window.current.clicks);
      }
      return {
        ...window,
        current: curr,
        previous: { clicks: Math.round(window.previous.clicks * ratio), impressions: Math.round(window.previous.impressions * ratio), position: window.previous.position, ctr: window.previous.ctr },
      };
    }

    // Populate country dropdown from union des pays presents
    function populateCountrySelect() {
      const sel = document.getElementById('country-select');
      const counts = new Map();
      SITES.forEach(s => {
        const w = getSiteWindow(s, currentPeriod);
        if (!w || w.error || !w.countries) return;
        Object.entries(w.countries).forEach(([code, d]) => counts.set(code, (counts.get(code) || 0) + d.clicks));
      });
      const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
      const current = sel.value;
      sel.innerHTML = '<option value="all">🌐 Tous pays</option>' + sorted.map(([c]) => '<option value="' + c + '">' + countryFlag(c) + ' ' + countryName(c) + '</option>').join('');
      if ([...sel.options].some(o => o.value === current)) sel.value = current;
    }

    // ----- CSV
    function downloadCSV(filename, rows) {
      const csv = rows.map(r => r.map(c => {
        const s = String(c ?? '');
        return /[",\\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      }).join(',')).join('\\n');
      const blob = new Blob(['\\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }

    // ----- Sidebar
    function renderNav() {
      const errors = SITES.filter(s => getSiteWindow(s, currentPeriod)?.error).length;
      const items = [];
      items.push(navItem('overview', '<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>', "Vue d'ensemble", errors));
      items.push(navItem('compare', '<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18M8 17V9M13 17V5M18 17v-6"/></svg>', 'Comparaison'));
      items.push('<div class="sidebar-section" style="padding-top:14px">Sites</div>');
      SITES.forEach((s) => {
        const w = getSiteWindow(s, currentPeriod);
        items.push(
          '<div class="nav-item ' + (currentView === s.domain ? 'active' : '') + '" data-view="' + s.domain + '">' +
            '<img class="nav-favicon" src="' + favicon(s.domain) + '" alt="">' +
            '<span class="nav-label">' + s.domain + '</span>' +
            (w?.error ? '<span class="nav-badge">!</span>' : '') +
          '</div>'
        );
      });
      $('#nav').innerHTML = items.join('');
      [...document.querySelectorAll('.nav-item')].forEach(el => el.addEventListener('click', () => setView(el.dataset.view)));
    }
    function navItem(view, icon, label, badge) {
      return '<div class="nav-item ' + (currentView === view ? 'active' : '') + '" data-view="' + view + '">' +
        icon + '<span class="nav-label">' + label + '</span>' +
        (badge ? '<span class="nav-badge">' + badge + '</span>' : '') +
      '</div>';
    }

    // ----- Overview
    function renderOverview() {
      $('#page-title').textContent = "Vue d'ensemble";
      const range = PAYLOAD.periods[currentPeriod];
      $('#page-sub').textContent = 'Periode du ' + range.startDate + ' au ' + range.endDate + ' (' + currentPeriod + ' jours, vs periode precedente)';

      const ok = SITES.filter(s => !getSiteWindow(s, currentPeriod)?.error);
      const totals = ok.reduce((acc, s) => {
        const w = deviceAdjust(getSiteWindow(s, currentPeriod));
        acc.clicks += w?.current?.clicks ?? 0;
        acc.impressions += w?.current?.impressions ?? 0;
        acc.prevClicks += w?.previous?.clicks ?? 0;
        acc.prevImpressions += w?.previous?.impressions ?? 0;
        acc.articles += getSiteArticles(s, currentPeriod);
        return acc;
      }, { clicks: 0, impressions: 0, prevClicks: 0, prevImpressions: 0, articles: 0 });

      const iconClick = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>';
      const iconEye = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>';
      const iconDoc = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>';
      const iconCheck = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>';

      const summary =
        '<div class="kpi-grid">' +
          kpiCard('Clics total', fmtNum(totals.clicks), deltaPct(totals.clicks, totals.prevClicks), iconClick) +
          kpiCard('Impressions', fmtNum(totals.impressions), deltaPct(totals.impressions, totals.prevImpressions), iconEye) +
          kpiCard('Articles publies', fmtNum(totals.articles), null, iconDoc) +
          kpiCard('Sites actifs', String(ok.length) + '<span class="sub">/' + SITES.length + '</span>', null, iconCheck) +
        '</div>';

      const trending = renderTrending();
      const grid = SITES.map(siteOverviewCard).join('');

      const exportBtn = '<button class="btn" id="export-global"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>Export CSV</button>';

      $('#content').innerHTML = summary + trending +
        '<h3 class="section-title">Sites <span class="hint">Cliquer pour voir le detail &middot; ' + exportBtn + '</span></h3>' +
        '<div class="sites-grid">' + grid + '</div>';

      [...document.querySelectorAll('.site-card')].forEach(el => el.addEventListener('click', () => setView(el.dataset.domain)));
      $('#export-global')?.addEventListener('click', exportGlobal);
      requestAnimationFrame(() => renderOverviewSparklines());
    }

    function kpiCard(label, valueHtml, delta, iconSvg) {
      return '<div class="kpi-card">' +
        '<div class="label">' + (iconSvg || '') + '<span>' + label + '</span></div>' +
        '<div class="value"><span class="num">' + valueHtml + '</span>' + (delta ? badge(delta) : '') + '</div>' +
      '</div>';
    }

    function siteOverviewCard(s) {
      const w = deviceAdjust(getSiteWindow(s, currentPeriod));
      if (w?.error) {
        return '<div class="site-error" data-domain="' + s.domain + '">' +
          '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">' +
            '<img src="' + favicon(s.domain) + '" style="width:22px;height:22px;border-radius:5px">' +
            '<div style="flex:1;font-weight:600">' + s.domain + '</div>' +
            '<span class="err-tag">Erreur GSC</span>' +
          '</div>' +
          '<div class="err-msg">' + (w.error || '') + '</div>' +
        '</div>';
      }
      const dClicks = deltaPct(w.current.clicks, w.previous.clicks);
      const dImp = deltaPct(w.current.impressions, w.previous.impressions);
      const dPos = deltaPos(w.current.position, w.previous.position);
      return '<div class="site-card" data-domain="' + s.domain + '">' +
        '<div class="head">' +
          '<img class="favicon" src="' + favicon(s.domain) + '" alt="">' +
          '<span class="domain">' + s.domain + '</span>' +
          '<svg class="arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 5l7 7-7 7"/></svg>' +
        '</div>' +
        '<div class="site-sparkline"><canvas id="spark-' + slug(s.domain) + '"></canvas></div>' +
        '<div class="site-kpis">' +
          '<div class="site-kpi"><div class="label">Clics</div><div class="num">' + fmtNum(w.current.clicks) + '</div><div class="delta">' + badge(dClicks) + '</div></div>' +
          '<div class="site-kpi"><div class="label">Impr.</div><div class="num">' + fmtNum(w.current.impressions) + '</div><div class="delta">' + badge(dImp) + '</div></div>' +
          '<div class="site-kpi"><div class="label">Pos.</div><div class="num">' + fmtPos(w.current.position) + '</div><div class="delta">' + badge(dPos) + '</div></div>' +
          '<div class="site-kpi"><div class="label">Articles</div><div class="num">' + fmtNum(getSiteArticles(s, currentPeriod)) + '</div><div class="delta"></div></div>' +
        '</div>' +
      '</div>';
    }

    function renderOverviewSparklines() {
      const days = parseInt(currentPeriod, 10);
      SITES.forEach(s => {
        const canvas = document.getElementById('spark-' + slug(s.domain));
        if (!canvas) return;
        const daily = s.data.windows?.daily;
        if (!Array.isArray(daily) || !daily.length) return;
        const series = daily.slice(-days);
        const data = series.map(d => d.clicks);
        const max = Math.max(...data, 1);
        const c = new Chart(canvas, {
          type: 'line',
          data: { labels: series.map(d => d.date), datasets: [{ data, borderColor: '#C2B642', backgroundColor: 'rgba(194,182,66,0.18)', borderWidth: 1.5, fill: true, tension: 0.4, pointRadius: 0 }] },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } }, scales: { x: { display: false }, y: { display: false, min: 0, max: max * 1.1 } }, animation: false, interaction: { mode: 'nearest', intersect: false } },
        });
        charts.push(c);
      });
    }

    // ----- Trending (cross-sites)
    function renderTrending() {
      const all = [];
      SITES.forEach(s => {
        const w = getSiteWindow(s, currentPeriod);
        if (!w || w.error) return;
        const pages = getPagesForView(w);
        pages.forEach(p => {
          const d = deltaPct(p.clicks, p.prevClicks);
          if (!d) return;
          all.push({ domain: s.domain, url: p.url, path: pathOf(p.url, s.domain), clicks: p.clicks, prevClicks: p.prevClicks, deltaPct: d.raw, deltaSign: d.sign, deltaLabel: d.label });
        });
      });
      // Hausses: tri delta absolu en clics positifs avec min 3 clics
      const ups = all.filter(p => p.deltaSign === 'up' && p.clicks >= 3).sort((a, b) => (b.clicks - b.prevClicks) - (a.clicks - a.prevClicks)).slice(0, 8);
      const downs = all.filter(p => p.deltaSign === 'down' && p.prevClicks >= 3).sort((a, b) => (a.clicks - a.prevClicks) - (b.clicks - b.prevClicks)).slice(0, 8);

      const rowHtml = (p) => '<a class="trending-row" href="' + p.url + '" target="_blank" rel="noopener">' +
          '<div class="trending-url"><div class="site">' + p.domain + '</div><div class="path" title="' + p.path + '">' + p.path + '</div></div>' +
          '<div class="clicks">' + fmtNum(p.clicks) + '</div>' +
          '<div>' + badge({ label: p.deltaLabel, sign: p.deltaSign }) + '</div>' +
        '</a>';

      if (!ups.length && !downs.length) return '';
      return '<h3 class="section-title">Pages en mouvement <span class="hint">vs periode precedente</span></h3>' +
        '<div class="trending-grid">' +
          '<div class="trending-card up"><div class="head"><span class="dot"></span>Top hausses</div>' + (ups.length ? ups.map(rowHtml).join('') : '<div class="empty-state">Rien a signaler</div>') + '</div>' +
          '<div class="trending-card down"><div class="head"><span class="dot"></span>Top baisses</div>' + (downs.length ? downs.map(rowHtml).join('') : '<div class="empty-state">Rien a signaler</div>') + '</div>' +
        '</div>';
    }

    // ----- Comparison view
    let compareSort = { col: 'clicks', dir: 'desc' };
    function renderCompare() {
      $('#page-title').textContent = 'Comparaison cross-sites';
      const range = PAYLOAD.periods[currentPeriod];
      $('#page-sub').textContent = 'Periode ' + range.startDate + ' au ' + range.endDate + ' (' + currentPeriod + ' jours)';

      const rows = SITES.map(s => {
        const w = deviceAdjust(getSiteWindow(s, currentPeriod));
        if (w?.error) return { domain: s.domain, error: w.error };
        return {
          domain: s.domain, repo: s.repo,
          clicks: w.current.clicks, prevClicks: w.previous.clicks,
          impressions: w.current.impressions, prevImpressions: w.previous.impressions,
          position: w.current.position, prevPosition: w.previous.position,
          ctr: w.current.ctr * 100,
          articles: getSiteArticles(s, currentPeriod),
        };
      });

      const sortKey = compareSort.col;
      const dir = compareSort.dir === 'asc' ? 1 : -1;
      const ok = rows.filter(r => !r.error);
      ok.sort((a, b) => {
        const va = a[sortKey] ?? 0, vb = b[sortKey] ?? 0;
        return (va > vb ? 1 : va < vb ? -1 : 0) * dir;
      });
      const errored = rows.filter(r => r.error);

      const th = (key, label, align = 'left') => {
        const isSorted = sortKey === key;
        const arrow = isSorted ? (compareSort.dir === 'asc' ? '↑' : '↓') : '';
        return '<th class="' + (align === 'right' ? 'right ' : '') + (isSorted ? 'sorted' : '') + '" data-sort="' + key + '">' + label + ' <span class="sort-arrow">' + arrow + '</span></th>';
      };

      const exportBtn = '<button class="btn" id="export-compare" style="margin-left:auto"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>Export CSV</button>';

      $('#content').innerHTML =
        '<div style="display:flex;align-items:center;margin-bottom:14px"><h3 class="section-title" style="margin:0">Tableau comparatif <span class="hint">Cliquer une colonne pour trier</span></h3>' + exportBtn + '</div>' +
        '<div class="compare-table"><table>' +
          '<thead><tr>' +
            th('domain', 'Site') +
            th('clicks', 'Clics', 'right') +
            '<th class="right">Δ</th>' +
            th('impressions', 'Impressions', 'right') +
            '<th class="right">Δ</th>' +
            th('position', 'Position', 'right') +
            '<th class="right">Δ</th>' +
            th('ctr', 'CTR', 'right') +
            th('articles', 'Articles', 'right') +
          '</tr></thead>' +
          '<tbody>' +
          ok.map(r => {
            const dC = deltaPct(r.clicks, r.prevClicks);
            const dI = deltaPct(r.impressions, r.prevImpressions);
            const dP = deltaPos(r.position, r.prevPosition);
            return '<tr data-domain="' + r.domain + '">' +
              '<td><div class="site-cell"><img src="' + favicon(r.domain) + '" alt="">' + r.domain + '</div></td>' +
              '<td class="right">' + fmtNum(r.clicks) + '</td>' +
              '<td class="right">' + badge(dC) + '</td>' +
              '<td class="right">' + fmtNum(r.impressions) + '</td>' +
              '<td class="right">' + badge(dI) + '</td>' +
              '<td class="right">' + fmtPos(r.position) + '</td>' +
              '<td class="right">' + badge(dP) + '</td>' +
              '<td class="right">' + r.ctr.toFixed(2) + '%</td>' +
              '<td class="right">' + fmtNum(r.articles) + '</td>' +
            '</tr>';
          }).join('') +
          errored.map(r => '<tr><td><div class="site-cell"><img src="' + favicon(r.domain) + '" alt="">' + r.domain + '</div></td><td colspan="8" class="right" style="color:var(--red);font-weight:500">' + r.error + '</td></tr>').join('') +
          '</tbody>' +
        '</table></div>';

      [...document.querySelectorAll('.compare-table th[data-sort]')].forEach(th => th.addEventListener('click', () => {
        const k = th.dataset.sort;
        if (compareSort.col === k) compareSort.dir = compareSort.dir === 'asc' ? 'desc' : 'asc';
        else { compareSort.col = k; compareSort.dir = 'desc'; }
        renderCompare();
      }));
      [...document.querySelectorAll('.compare-table tbody tr[data-domain]')].forEach(tr => tr.addEventListener('click', () => setView(tr.dataset.domain)));
      $('#export-compare')?.addEventListener('click', () => {
        const rows2 = [['Domaine','Clics','PrevClics','Impressions','PrevImpressions','Position','PrevPosition','CTR%','Articles']];
        ok.forEach(r => rows2.push([r.domain, r.clicks, r.prevClicks, r.impressions, r.prevImpressions, r.position?.toFixed(2), r.prevPosition?.toFixed(2), r.ctr.toFixed(2), r.articles]));
        downloadCSV('pbn-comparison-' + currentPeriod + 'j.csv', rows2);
      });
    }

    // ----- Detail view
    let detailState = { tab: 'pages', pages: { page: 1 }, queries: { page: 1 }, filter: '' };

    function renderDetail(domain) {
      const site = SITES.find(s => s.domain === domain);
      if (!site) { renderOverview(); return; }
      $('#page-title').textContent = site.domain;
      const w = deviceAdjust(getSiteWindow(site, currentPeriod));
      const range = PAYLOAD.periods[currentPeriod];
      $('#page-sub').textContent = 'Periode ' + range.startDate + ' au ' + range.endDate;

      if (w?.error) {
        $('#content').innerHTML =
          '<div class="detail-head"><img class="favicon" src="' + favicon(site.domain) + '" alt=""><div class="info"><h1>' + site.domain + '</h1></div></div>' +
          '<div class="site-error" style="margin-top:16px"><span class="err-tag">Erreur GSC</span><div class="err-msg" style="margin-top:10px">' + w.error + '</div><div class="err-msg" style="margin-top:6px">Propriete: <code>' + site.gscProperty + '</code></div></div>';
        return;
      }

      const dClicks = deltaPct(w.current.clicks, w.previous.clicks);
      const dImp = deltaPct(w.current.impressions, w.previous.impressions);
      const dPos = deltaPos(w.current.position, w.previous.position);
      const dCtr = deltaPct(w.current.ctr * 100, w.previous.ctr * 100);

      const exportBtn = '<button class="btn primary" id="export-site"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>Export CSV</button>';

      const head = '<div class="detail-head">' +
          '<img class="favicon" src="' + favicon(site.domain) + '" alt="">' +
          '<div class="info">' +
            '<h1>' + site.domain + '</h1>' +
            '<div class="links">' +
              '<a href="https://' + site.domain + '" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg> Voir le site</a>' +
              (site.repo ? '<a href="https://github.com/' + site.repo + '" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.4 3-.405 1.02.005 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg> Repo</a>' : '') +
              (site.repo ? '<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg> ' + getSiteArticles(site, currentPeriod) + ' articles publies</span>' : '') +
            '</div>' +
          '</div>' +
          exportBtn +
        '</div>';

      const kpis = '<div class="kpi-grid">' +
        kpiCard('Clics', fmtNum(w.current.clicks), dClicks) +
        kpiCard('Impressions', fmtNum(w.current.impressions), dImp) +
        kpiCard('CTR', (w.current.ctr * 100).toFixed(2) + '%', dCtr) +
        kpiCard('Position moy.', fmtPos(w.current.position), dPos) +
      '</div>';

      const chartsHtml = '<div class="chart-grid">' +
          '<div class="chart-card"><h3>Clics par jour</h3><div class="chart-sub">' + currentPeriod + ' derniers jours</div><div class="chart-wrap"><canvas id="chart-clicks"></canvas></div></div>' +
          '<div class="chart-card"><h3>Impressions par jour</h3><div class="chart-sub">' + currentPeriod + ' derniers jours</div><div class="chart-wrap"><canvas id="chart-impressions"></canvas></div></div>' +
        '</div>' +
        '<div class="chart-card" style="margin-top:0"><h3>Position moyenne</h3><div class="chart-sub">Inversee: plus bas = mieux (' + currentPeriod + ' jours)</div><div class="chart-wrap"><canvas id="chart-position"></canvas></div></div>';

      const tableHtml = '<div class="data-table" id="data-table" style="margin-top:20px">' +
          '<div class="head">' +
            '<div class="tabs">' +
              '<button class="tab-btn ' + (detailState.tab === 'pages' ? 'active' : '') + '" data-tab="pages">Pages</button>' +
              '<button class="tab-btn ' + (detailState.tab === 'queries' ? 'active' : '') + '" data-tab="queries">Mots-cles</button>' +
            '</div>' +
            '<span class="count" id="data-count"></span>' +
            '<div class="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg><input type="search" id="data-search" placeholder="Rechercher..."></div>' +
          '</div>' +
          '<div id="data-cols"></div>' +
          '<div id="data-list"></div>' +
          '<div class="pagination" id="data-pagination"></div>' +
        '</div>';

      $('#content').innerHTML = head + kpis + chartsHtml + tableHtml;

      $('#export-site').addEventListener('click', () => exportSite(site, w));
      [...document.querySelectorAll('.tab-btn')].forEach(b => b.addEventListener('click', () => {
        detailState.tab = b.dataset.tab; detailState.filter = '';
        const searchEl = $('#data-search'); if (searchEl) searchEl.value = '';
        [...document.querySelectorAll('.tab-btn')].forEach(x => x.classList.toggle('active', x.dataset.tab === detailState.tab));
        renderDataTable(site, w);
      }));
      $('#data-search').addEventListener('input', (e) => {
        clearTimeout(detailState.tFilter);
        detailState.tFilter = setTimeout(() => { detailState.filter = e.target.value.toLowerCase(); detailState[detailState.tab].page = 1; renderDataTable(site, w); }, 80);
      });
      renderDataTable(site, w);
      requestAnimationFrame(() => renderDetailCharts(site));
    }

    function renderDataTable(site, w) {
      const tab = detailState.tab;
      const all = tab === 'pages' ? getPagesForView(w) : getQueriesForView(w);
      const filter = detailState.filter;
      const filtered = filter ? all.filter(it => (tab === 'pages' ? it.url : it.query).toLowerCase().includes(filter)) : all;
      const state = detailState[tab];
      const perPage = 10;
      const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
      if (state.page > totalPages) state.page = totalPages;
      const start = (state.page - 1) * perPage;
      const slice = filtered.slice(start, start + perPage);

      const cols = tab === 'pages'
        ? '<div class="data-cols pages"><div>#</div><div>URL</div><div class="right">Clics</div><div class="right">Δ</div><div class="right">Impr.</div><div class="right">Δ</div><div class="right">Pos.</div><div class="right">Δ</div></div>'
        : '<div class="data-cols queries"><div>#</div><div>Mot-cle</div><div class="right">Clics</div><div class="right">Δ</div><div class="right">Impr.</div><div class="right">Δ</div><div class="right">Pos.</div><div class="right">Δ</div></div>';
      $('#data-cols').innerHTML = cols;

      $('#data-count').textContent = filter ? (filtered.length + ' / ' + all.length) : (all.length + ' au total');
      $('#data-list').innerHTML = slice.length
        ? slice.map((it, i) => tab === 'pages' ? renderPageRow(it, start + i, site.domain) : renderQueryRow(it, start + i)).join('')
        : '<div class="empty-state">Aucun resultat</div>';

      const end = Math.min(start + perPage, filtered.length);
      const info = filtered.length ? (start + 1) + '-' + end + ' sur ' + filtered.length : '0 element';
      $('#data-pagination').innerHTML = '<div class="info">' + info + '</div><div class="pager">' + buildPager(state.page, totalPages) + '</div>';
      [...$('#data-pagination').querySelectorAll('[data-goto]')].forEach(b => b.addEventListener('click', () => { state.page = parseInt(b.dataset.goto, 10); renderDataTable(site, w); }));
    }

    function renderPageRow(p, idx, domain) {
      const dC = deltaPct(p.clicks, p.prevClicks);
      const dI = deltaPct(p.impressions, p.prevImpressions);
      const dP = deltaPos(p.position, p.prevPosition);
      const path = pathOf(p.url, domain);
      return '<div class="data-row pages">' +
        '<div class="rank">' + (idx + 1) + '</div>' +
        '<a class="url" href="' + p.url + '" target="_blank" rel="noopener" title="' + p.url + '">' + path + '</a>' +
        '<div class="num">' + fmtNum(p.clicks) + '</div><div class="delta-cell">' + badge(dC) + '</div>' +
        '<div class="num-light">' + fmtNum(p.impressions) + '</div><div class="delta-cell">' + badge(dI) + '</div>' +
        '<div class="num-light">' + fmtPos(p.position) + '</div><div class="delta-cell">' + badge(dP) + '</div>' +
      '</div>';
    }
    function renderQueryRow(q, idx) {
      const dC = deltaPct(q.clicks, q.prevClicks);
      const dI = deltaPct(q.impressions, q.prevImpressions);
      const dP = deltaPos(q.position, q.prevPosition);
      return '<div class="data-row queries">' +
        '<div class="rank">' + (idx + 1) + '</div>' +
        '<div class="qtext" title="' + escapeAttr(q.query) + '">' + escapeAttr(q.query) + '</div>' +
        '<div class="num">' + fmtNum(q.clicks) + '</div><div class="delta-cell">' + badge(dC) + '</div>' +
        '<div class="num-light">' + fmtNum(q.impressions) + '</div><div class="delta-cell">' + badge(dI) + '</div>' +
        '<div class="num-light">' + fmtPos(q.position) + '</div><div class="delta-cell">' + badge(dP) + '</div>' +
      '</div>';
    }
    function escapeAttr(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

    function buildPager(current, total) {
      if (total <= 1) return '<button class="pager-btn active">1</button>';
      const btns = [];
      btns.push('<button class="pager-btn" data-goto="' + (current - 1) + '" ' + (current === 1 ? 'disabled' : '') + '>‹</button>');
      const pages = pageWindow(current, total);
      pages.forEach(p => p === '...' ? btns.push('<span class="pager-ellipsis">…</span>') : btns.push('<button class="pager-btn ' + (p === current ? 'active' : '') + '" data-goto="' + p + '">' + p + '</button>'));
      btns.push('<button class="pager-btn" data-goto="' + (current + 1) + '" ' + (current === total ? 'disabled' : '') + '>›</button>');
      return btns.join('');
    }
    function pageWindow(current, total) {
      if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
      const set = new Set([1, total, current, current - 1, current + 1]);
      if (current <= 3) [2, 3, 4].forEach(n => set.add(n));
      if (current >= total - 2) [total - 1, total - 2, total - 3].forEach(n => set.add(n));
      const arr = [...set].filter(n => n >= 1 && n <= total).sort((a, b) => a - b);
      const result = [];
      for (let i = 0; i < arr.length; i++) { result.push(arr[i]); if (i + 1 < arr.length && arr[i + 1] - arr[i] > 1) result.push('...'); }
      return result;
    }

    function destroyCharts() { charts.forEach(c => c.destroy()); charts = []; }

    function renderDetailCharts(site) {
      destroyCharts();
      const daily = site.data.windows?.daily;
      if (!Array.isArray(daily)) return;
      const days = parseInt(currentPeriod, 10);
      const series = daily.slice(-days);
      const labels = series.map(d => fmtDate(d.date));

      const baseOpts = {
        responsive: true, maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false, backgroundColor: '#1A1A1A', titleColor: '#FFF', bodyColor: '#FFF', padding: 10, displayColors: false } },
        scales: { x: { grid: { display: false }, ticks: { color: '#9C9C90', font: { size: 10 }, maxRotation: 0, autoSkipPadding: 20 } }, y: { grid: { color: '#F2F0EB' }, border: { display: false }, ticks: { color: '#9C9C90', font: { size: 10 } }, beginAtZero: true } },
      };
      const mkLineData = (label, data, color, bg) => ({ labels, datasets: [{ label, data, borderColor: color, backgroundColor: bg, borderWidth: 2, fill: true, tension: 0.35, pointRadius: 0, pointHoverRadius: 4, pointHoverBackgroundColor: color, pointHoverBorderColor: '#FFF', pointHoverBorderWidth: 2 }] });

      const cD = mkLineData('Clics', series.map(d => d.clicks), '#C2B642', 'rgba(194,182,66,0.12)');
      const iD = mkLineData('Impressions', series.map(d => d.impressions), '#4A90D9', 'rgba(74,144,217,0.10)');
      const pSeries = series.map(d => d.position > 0 ? d.position : null);
      const pD = mkLineData('Position', pSeries, '#7B61FF', 'rgba(123,97,255,0.10)');
      pD.datasets[0].spanGaps = true;

      charts.push(new Chart(document.getElementById('chart-clicks'), { type: 'line', data: cD, options: baseOpts }));
      charts.push(new Chart(document.getElementById('chart-impressions'), { type: 'line', data: iD, options: baseOpts }));
      charts.push(new Chart(document.getElementById('chart-position'), { type: 'line', data: pD, options: { ...baseOpts, scales: { ...baseOpts.scales, y: { ...baseOpts.scales.y, reverse: true, beginAtZero: false, ticks: { ...baseOpts.scales.y.ticks, callback: v => v.toFixed(1) } } } } }));
    }

    // ----- CSV exports
    function exportSite(site, w) {
      const isQueries = detailState.tab === 'queries';
      const rows = [];
      const suffix = currentCountry === 'all' ? '' : '-' + currentCountry;
      if (isQueries) {
        rows.push(['Mot-cle', 'Clics', 'PrevClics', 'Impressions', 'PrevImpressions', 'Position', 'PrevPosition', 'CTR%']);
        getQueriesForView(w).forEach(q => rows.push([q.query, q.clicks, q.prevClicks, q.impressions, q.prevImpressions, q.position?.toFixed(2), q.prevPosition?.toFixed(2), (q.ctr * 100).toFixed(2)]));
        downloadCSV(site.domain + '-queries-' + currentPeriod + 'j' + suffix + '.csv', rows);
      } else {
        rows.push(['URL', 'Clics', 'PrevClics', 'Impressions', 'PrevImpressions', 'Position', 'PrevPosition']);
        getPagesForView(w).forEach(p => rows.push([p.url, p.clicks, p.prevClicks, p.impressions, p.prevImpressions, p.position?.toFixed(2), p.prevPosition?.toFixed(2)]));
        downloadCSV(site.domain + '-pages-' + currentPeriod + 'j' + suffix + '.csv', rows);
      }
    }
    function exportGlobal() {
      const rows = [['Domaine', 'Clics', 'PrevClics', 'Impressions', 'PrevImpressions', 'Position', 'PrevPosition', 'CTR%', 'Articles']];
      SITES.forEach(s => {
        const w = deviceAdjust(getSiteWindow(s, currentPeriod));
        if (w?.error) { rows.push([s.domain, 'ERREUR', w.error]); return; }
        rows.push([s.domain, w.current.clicks, w.previous.clicks, w.current.impressions, w.previous.impressions, w.current.position?.toFixed(2), w.previous.position?.toFixed(2), (w.current.ctr * 100).toFixed(2), getSiteArticles(s, currentPeriod)]);
      });
      downloadCSV('pbn-overview-' + currentPeriod + 'j.csv', rows);
    }

    // ----- Router
    function setView(view) {
      currentView = view; destroyCharts();
      if (view === 'overview') renderOverview();
      else if (view === 'compare') renderCompare();
      else renderDetail(view);
      renderNav();
      try { history.replaceState(null, '', '#' + (view === 'overview' ? '' : encodeURIComponent(view))); } catch {}
    }
    function setPeriod(p) {
      currentPeriod = p;
      [...document.querySelectorAll('#period-switch button')].forEach(b => b.classList.toggle('active', b.dataset.period === p));
      populateCountrySelect();
      destroyCharts(); refreshCurrentView();
    }
    function setDevice(d) {
      currentDevice = d;
      [...document.querySelectorAll('#device-switch button')].forEach(b => b.classList.toggle('active', b.dataset.device === d));
      destroyCharts(); refreshCurrentView();
    }
    function refreshCurrentView() {
      if (currentView === 'overview') renderOverview();
      else if (currentView === 'compare') renderCompare();
      else renderDetail(currentView);
      renderNav();
    }

    [...document.querySelectorAll('#period-switch button')].forEach(b => b.addEventListener('click', () => setPeriod(b.dataset.period)));
    [...document.querySelectorAll('#device-switch button')].forEach(b => b.addEventListener('click', () => setDevice(b.dataset.device)));
    document.getElementById('country-select').addEventListener('change', (e) => { currentCountry = e.target.value; destroyCharts(); refreshCurrentView(); });

    populateCountrySelect();

    const hash = decodeURIComponent(location.hash.slice(1));
    if (hash === 'compare') currentView = 'compare';
    else if (hash && SITES.find(s => s.domain === hash)) currentView = hash;
    renderNav();
    refreshCurrentView();
  </script>
</body>
</html>
`;
}
