// Mapping des 7 sites PBN: domaine -> propriete GSC + repo GitHub + dossier articles
// La propriete GSC doit matcher EXACTEMENT ce qui est enregistre dans Search Console
// (URL prefix avec https:// et trailing slash, ou domain property type sc-domain:domaine.tld).
// Par defaut on part sur domain property. Si une propriete est URL prefix, remplacer.

export const SITES = [
  {
    domain: 'avis-services.fr',
    gscProperty: 'sc-domain:avis-services.fr',
    repo: 'analytics-ds/avis-services-fr',
    articlesPath: 'content/blog',
  },
  {
    domain: 'comparatif-mode.com',
    gscProperty: 'sc-domain:comparatif-mode.com',
    repo: 'analytics-ds/comparatif-mode',
    articlesPath: 'content/fr/blog',
  },
  {
    domain: 'comparatif-pro.com',
    gscProperty: 'sc-domain:comparatif-pro.com',
    repo: 'analytics-ds/comparatif-pro',
    articlesPath: 'content/blog',
  },
  {
    domain: 'guide-maison-habitat.com',
    gscProperty: 'sc-domain:guide-maison-habitat.com',
    repo: 'analytics-ds/guide-maison-habitat',
    articlesPath: 'content/blog',
  },
  {
    domain: 'meilleur-classement.com',
    gscProperty: 'https://meilleur-classement.com/',
    repo: 'analytics-ds/meilleur-classement',
    articlesPath: 'src/content/blog',
  },
  {
    domain: 'meilleur-transport.com',
    gscProperty: 'sc-domain:meilleur-transport.com',
    repo: 'analytics-ds/meilleur-transport',
    articlesPath: 'content/blog',
  },
  {
    domain: 'quel-placement.com',
    gscProperty: 'sc-domain:quel-placement.com',
    repo: 'analytics-ds/quel-placement',
    articlesPath: 'content/blog',
  },
];
