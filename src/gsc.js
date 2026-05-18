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

async function querySite(searchconsole, siteUrl, { startDate, endDate, dimensions = [], rowLimit = 1 }) {
  try {
    const res = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: { startDate, endDate, dimensions, rowLimit, dataState: 'final' },
    });
    return res.data.rows ?? [];
  } catch (err) {
    const msg = err.response?.data?.error?.message ?? err.message;
    return { error: msg };
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
    querySite(searchconsole, gscProperty, { ...current, dimensions: ['page'], rowLimit: 1000 }),
    querySite(searchconsole, gscProperty, { ...previous, dimensions: ['page'], rowLimit: 1000 }),
    querySite(searchconsole, gscProperty, { ...current, dimensions: ['query'], rowLimit: 500 }),
    querySite(searchconsole, gscProperty, { ...previous, dimensions: ['query'], rowLimit: 500 }),
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
  const currPages = rowsToPages(currPagesRaw).filter(p => isCleanUrl(p.url));
  const prevByUrl = new Map(rowsToPages(prevPagesRaw).filter(p => isCleanUrl(p.url)).map(p => [p.url, p]));

  const pages = currPages.map(p => {
    const prev = prevByUrl.get(p.url);
    return {
      url: p.url,
      clicks: p.clicks,
      impressions: p.impressions,
      position: p.position,
      prevClicks: prev?.clicks ?? 0,
      prevImpressions: prev?.impressions ?? 0,
      prevPosition: prev?.position ?? null,
    };
  });

  // Queries
  const rowsToQueries = (rows) => {
    if (rows.error) return [];
    return rows.map(r => ({
      query: r.keys?.[0] ?? '',
      clicks: r.clicks ?? 0,
      impressions: r.impressions ?? 0,
      position: r.position ?? 0,
      ctr: r.ctr ?? 0,
    }));
  };
  const currQueries = rowsToQueries(currQueriesRaw);
  const prevByQuery = new Map(rowsToQueries(prevQueriesRaw).map(q => [q.query, q]));
  const queries = currQueries.map(q => {
    const prev = prevByQuery.get(q.query);
    return {
      ...q,
      prevClicks: prev?.clicks ?? 0,
      prevImpressions: prev?.impressions ?? 0,
      prevPosition: prev?.position ?? null,
    };
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
    pages,
    queries,
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
