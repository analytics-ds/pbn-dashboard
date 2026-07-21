// Liste des sites PBN suivis. La SOURCE DE VERITE est le fichier tracked.json
// (edite via le panneau "Sites suivis" du dashboard, qui ouvre une issue GitHub
// appliquee automatiquement par le workflow apply-tracked.yml).
//
// Chaque entree : domaine -> propriete GSC + repo GitHub + dossier articles.
// La propriete GSC doit matcher EXACTEMENT Search Console (URL prefix avec
// https:// et trailing slash, ou domain property "sc-domain:domaine.tld").
// Pour un domaine ajoute depuis le dashboard, repo/articlesPath valent null
// (analyse Search Console seule, sans comptage d'articles) tant qu'on ne les
// renseigne pas ici.
import { readFileSync } from 'node:fs';

export const SITES = JSON.parse(
  readFileSync(new URL('./tracked.json', import.meta.url), 'utf8')
);
