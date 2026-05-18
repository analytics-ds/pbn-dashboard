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
  const [currTotalsRaw, prevTotalsRaw, currPagesRaw, prevPagesRaw] = await Promise.all([
    querySite(searchconsole, gscProperty, { ...current, rowLimit: 1 }),
    querySite(searchconsole, gscProperty, { ...previous, rowLimit: 1 }),
    querySite(searchconsole, gscProperty, { ...current, dimensions: ['page'], rowLimit: 50 }),
    querySite(searchconsole, gscProperty, { ...previous, dimensions: ['page'], rowLimit: 100 }),
  ]);

  if (currTotalsRaw.error) {
    return { error: currTotalsRaw.error, period: current };
  }

  const currTotals = rowsToTotals(currTotalsRaw);
  const prevTotals = rowsToTotals(prevTotalsRaw);
  const currPages = rowsToPages(currPagesRaw);
  const prevByUrl = new Map(rowsToPages(prevPagesRaw).map(p => [p.url, p]));

  const topPages = currPages.slice(0, 10).map(p => ({
    url: p.url,
    clicks: p.clicks,
    impressions: p.impressions,
    position: p.position,
    prevClicks: prevByUrl.get(p.url)?.clicks ?? 0,
  }));

  return {
    period: current,
    previousPeriod: previous,
    current: currTotals,
    previous: prevTotals,
    topPages,
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
