import { google } from 'googleapis';

// Domaine lisible a partir d'une propriete Search Console.
// "sc-domain:exemple.fr" -> "exemple.fr" ; "https://www.exemple.fr/" -> "exemple.fr".
export function domainOf(gscProperty) {
  if (!gscProperty) return '';
  if (gscProperty.startsWith('sc-domain:')) return gscProperty.slice('sc-domain:'.length);
  try {
    return new URL(gscProperty).host.replace(/^www\./, '');
  } catch {
    return gscProperty;
  }
}

/**
 * Liste toutes les proprietes Search Console accessibles par le compte
 * (analytics@datashake.fr), pour alimenter le panneau "Sites suivis".
 * On exclut les proprietes ou le compte n'a aucun acces reel (siteUnverifiedUser).
 */
export async function fetchAvailableDomains(auth) {
  const sc = google.searchconsole({ version: 'v1', auth });
  try {
    const res = await sc.sites.list();
    const entries = res.data.siteEntry ?? [];
    return entries
      .filter((e) => e.permissionLevel && e.permissionLevel !== 'siteUnverifiedUser')
      .map((e) => ({
        gscProperty: e.siteUrl,
        permission: e.permissionLevel,
        domain: domainOf(e.siteUrl),
      }))
      .sort((a, b) => a.domain.localeCompare(b.domain));
  } catch (err) {
    console.warn('sites.list a echoue:', err.message);
    return [];
  }
}
