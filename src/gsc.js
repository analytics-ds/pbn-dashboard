import { google } from 'googleapis';

/**
 * Decale d'une date en YYYY-MM-DD a aujourd'hui - N jours.
 */
function dayMinus(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

export function getDateRanges() {
  // GSC a un retard de 2-3 jours, on calcule sur des jours complets
  return {
    current: { startDate: dayMinus(8), endDate: dayMinus(2) },
    previous: { startDate: dayMinus(15), endDate: dayMinus(9) },
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

/**
 * Pull metrics + top pages pour un site, avec comparaison WoW.
 */
export async function fetchSiteMetrics(auth, gscProperty) {
  const searchconsole = google.searchconsole({ version: 'v1', auth });
  const { current, previous } = getDateRanges();

  const [currTotalsRaw, prevTotalsRaw, currPagesRaw, prevPagesRaw] = await Promise.all([
    querySite(searchconsole, gscProperty, { ...current, rowLimit: 1 }),
    querySite(searchconsole, gscProperty, { ...previous, rowLimit: 1 }),
    querySite(searchconsole, gscProperty, { ...current, dimensions: ['page'], rowLimit: 100 }),
    querySite(searchconsole, gscProperty, { ...previous, dimensions: ['page'], rowLimit: 100 }),
  ]);

  if (currTotalsRaw.error) {
    return { error: currTotalsRaw.error, period: current };
  }

  const currTotals = rowsToTotals(currTotalsRaw);
  const prevTotals = rowsToTotals(prevTotalsRaw);
  const currPages = rowsToPages(currPagesRaw);
  const prevByUrl = new Map(rowsToPages(prevPagesRaw).map(p => [p.url, p]));

  const topPages = currPages.slice(0, 10).map(p => {
    const prev = prevByUrl.get(p.url);
    return {
      url: p.url,
      clicks: p.clicks,
      impressions: p.impressions,
      position: p.position,
      prevClicks: prev?.clicks ?? 0,
      prevPosition: prev?.position ?? null,
    };
  });

  return {
    period: current,
    previousPeriod: previous,
    current: currTotals,
    previous: prevTotals,
    topPages,
  };
}
