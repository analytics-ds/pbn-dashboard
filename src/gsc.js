import { google } from 'googleapis';

function dayMinus(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

// GSC retard 2-3 jours: on demarre toujours a J-2
const GSC_DELAY_DAYS = 2;

export function rangesForWindow(days) {
  return {
    current: { startDate: dayMinus(GSC_DELAY_DAYS + days - 1), endDate: dayMinus(GSC_DELAY_DAYS) },
    previous: { startDate: dayMinus(GSC_DELAY_DAYS + 2 * days - 1), endDate: dayMinus(GSC_DELAY_DAYS + days) },
  };
}

export function buildAuth({ clientId, clientSecret, refreshToken }) {
  const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
  oauth2.setCredentials({ refresh_token: refreshToken });
  return oauth2;
}

// Erreurs transitoires qu'on peut retenter :
// - reseau (runner GitHub qui n'atteint pas googleapis.com)
// - quota de debit GSC ("Search Analytics load quota exceeded", 429/403 rate limit)
//   qui saute quand trop de requetes partent en rafale
function isTransientError(err) {
  const status = err.response?.status;
  if (status >= 500 || status === 429) return true;
  const apiMsg = err.response?.data?.error?.message ?? '';
  const msg = (err.message ?? '') + ' ' + apiMsg;
  return /failed, reason|ECONNRESET|ETIMEDOUT|EAI_AGAIN|socket hang up|load quota exceeded|rate limit|user rate limit|quota exceeded/i.test(msg);
}

async function querySite(searchconsole, siteUrl, { startDate, endDate, dimensions = [], rowLimit = 1 }) {
  const MAX_ATTEMPTS = 5;
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await searchconsole.searchanalytics.query({
        siteUrl,
        requestBody: { startDate, endDate, dimensions, rowLimit, dataState: 'final' },
      });
      return res.data.rows ?? [];
    } catch (err) {
      if (isTransientError(err) && attempt < MAX_ATTEMPTS) {
        // Backoff exponentiel + jitter (2s, 4s, 8s, 16s) pour laisser
        // retomber le quota de debit avant de retenter.
        const base = 2000 * 2 ** (attempt - 1);
        await new Promise(r => setTimeout(r, base + Math.floor(base * 0.3 * (attempt % 3) / 2)));
        continue;
      }
      const msg = err.response?.data?.error?.message ?? err.message;
      return { error: msg };
    }
  }
}

function rowsToTotals(rows) {
  if (rows.error) return { error: rows.error };
  if (!rows.length) return { clicks: 0, impressions: 0, ctr: 0, position: 0 };
  const r = rows[0];
  return {
    clicks: r.clicks ?? 0,
    impressions: r.impressions ?? 0,
    ctr: r.ctr ?? 0,
    position: r.position ?? 0,
  };
}

function rowsToPages(rows) {
  if (rows.error) return [];
  return rows.map(r => ({
    url: r.keys?.[0] ?? '',
    clicks: r.clicks ?? 0,
    impressions: r.impressions ?? 0,
    position: r.position ?? 0,
  }));
}

async function fetchWindow(searchconsole, gscProperty, days) {
  const { current, previous } = rangesForWindow(days);
  const [currTotalsRaw, prevTotalsRaw, currPagesRaw, prevPagesRaw, currQueriesRaw, prevQueriesRaw, currDeviceRaw, currCountryRaw] = await Promise.all([
    querySite(searchconsole, gscProperty, { ...current, rowLimit: 1 }),
    querySite(searchconsole, gscProperty, { ...previous, rowLimit: 1 }),
    querySite(searchconsole, gscProperty, { ...current, dimensions: ['page', 'country'], rowLimit: 2000 }),
    querySite(searchconsole, gscProperty, { ...previous, dimensions: ['page', 'country'], rowLimit: 2000 }),
    querySite(searchconsole, gscProperty, { ...current, dimensions: ['query', 'country'], rowLimit: 2000 }),
    querySite(searchconsole, gscProperty, { ...previous, dimensions: ['query', 'country'], rowLimit: 2000 }),
    querySite(searchconsole, gscProperty, { ...current, dimensions: ['device'], rowLimit: 5 }),
    querySite(searchconsole, gscProperty, { ...current, dimensions: ['country'], rowLimit: 50 }),
  ]);

  if (currTotalsRaw.error) {
    return { error: currTotalsRaw.error, period: current };
  }

  const currTotals = rowsToTotals(currTotalsRaw);
  const prevTotals = rowsToTotals(prevTotalsRaw);
  // Filtre URLs avec hashtag ou parametres
  const isCleanUrl = (u) => !u.includes('#') && !u.includes('?');

  // Pages avec dimension country: une row par (page, country)
  const rowsToPageCountry = (rows) => {
    if (rows.error) return [];
    return rows.map(r => ({
      url: r.keys?.[0] ?? '',
      country: (r.keys?.[1] ?? '').toLowerCase(),
      clicks: r.clicks ?? 0,
      impressions: r.impressions ?? 0,
      position: r.position ?? 0,
    }));
  };
  const currPagesCC = rowsToPageCountry(currPagesRaw).filter(p => isCleanUrl(p.url));
  const prevPagesCC = rowsToPageCountry(prevPagesRaw).filter(p => isCleanUrl(p.url));
  const prevPageMap = new Map(prevPagesCC.map(p => [p.url + '|' + p.country, p]));
  const pagesByCountry = currPagesCC.map(p => {
    const prev = prevPageMap.get(p.url + '|' + p.country);
    return { ...p, prevClicks: prev?.clicks ?? 0, prevImpressions: prev?.impressions ?? 0, prevPosition: prev?.position ?? null };
  });

  // Queries avec dimension country
  const rowsToQueryCountry = (rows) => {
    if (rows.error) return [];
    return rows.map(r => ({
      query: r.keys?.[0] ?? '',
      country: (r.keys?.[1] ?? '').toLowerCase(),
      clicks: r.clicks ?? 0,
      impressions: r.impressions ?? 0,
      position: r.position ?? 0,
      ctr: r.ctr ?? 0,
    }));
  };
  const currQueriesCC = rowsToQueryCountry(currQueriesRaw);
  const prevQueriesCC = rowsToQueryCountry(prevQueriesRaw);
  const prevQueryMap = new Map(prevQueriesCC.map(q => [q.query + '|' + q.country, q]));
  const queriesByCountry = currQueriesCC.map(q => {
    const prev = prevQueryMap.get(q.query + '|' + q.country);
    return { ...q, prevClicks: prev?.clicks ?? 0, prevImpressions: prev?.impressions ?? 0, prevPosition: prev?.position ?? null };
  });

  // Device breakdown
  const devices = {};
  if (!currDeviceRaw.error) {
    for (const r of currDeviceRaw) {
      const dev = (r.keys?.[0] ?? '').toLowerCase();
      if (!dev) continue;
      devices[dev] = {
        clicks: r.clicks ?? 0,
        impressions: r.impressions ?? 0,
        position: r.position ?? 0,
        ctr: r.ctr ?? 0,
      };
    }
  }

  // Country breakdown (codes ISO 3166-1 alpha-3 retournes par GSC: fra, usa, ...)
  const countries = {};
  if (!currCountryRaw.error) {
    for (const r of currCountryRaw) {
      const c = (r.keys?.[0] ?? '').toLowerCase();
      if (!c) continue;
      countries[c] = {
        clicks: r.clicks ?? 0,
        impressions: r.impressions ?? 0,
        position: r.position ?? 0,
        ctr: r.ctr ?? 0,
      };
    }
  }

  return {
    period: current,
    previousPeriod: previous,
    current: currTotals,
    previous: prevTotals,
    pagesByCountry,
    queriesByCountry,
    devices,
    countries,
  };
}

async function fetchDailySeries(searchconsole, gscProperty, days = 90) {
  const { current } = rangesForWindow(days);
  const rows = await querySite(searchconsole, gscProperty, { ...current, dimensions: ['date'], rowLimit: days + 5 });
  if (rows.error) return { error: rows.error };
  return rows.map(r => ({
    date: r.keys?.[0],
    clicks: r.clicks ?? 0,
    impressions: r.impressions ?? 0,
    position: r.position ?? 0,
    ctr: r.ctr ?? 0,
  })).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Pull metrics pour 3 fenetres (7j, 28j, 90j) + serie quotidienne sur 90j.
 */
export async function fetchSiteWindows(auth, gscProperty) {
  const searchconsole = google.searchconsole({ version: 'v1', auth });
  const [w7, w28, w90, daily] = await Promise.all([
    fetchWindow(searchconsole, gscProperty, 7),
    fetchWindow(searchconsole, gscProperty, 28),
    fetchWindow(searchconsole, gscProperty, 90),
    fetchDailySeries(searchconsole, gscProperty, 90),
  ]);
  return { '7': w7, '28': w28, '90': w90, daily };
}
