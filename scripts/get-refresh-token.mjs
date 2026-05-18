#!/usr/bin/env node
// Script local pour obtenir un refresh_token Google OAuth qui sera utilise
// par GitHub Actions pour appeler l'API Search Console.
//
// Usage:
//   1. Creer un OAuth client "Desktop app" dans Google Cloud Console
//   2. Activer l'API Search Console dans le meme projet
//   3. Exporter:
//        export GOOGLE_CLIENT_ID="..."
//        export GOOGLE_CLIENT_SECRET="..."
//   4. Lancer: npm run get-refresh-token
//   5. Ouvrir l'URL imprimee, accepter avec le compte Google qui a acces aux GSC
//   6. Copier le refresh_token affiche dans les secrets GitHub du repo

import { google } from 'googleapis';
import http from 'node:http';
import { URL } from 'node:url';

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.error('GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET requis dans l\'environnement');
  process.exit(1);
}

const PORT = 8765;
const REDIRECT = `http://localhost:${PORT}/oauth2callback`;
const SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly'];

const oauth2 = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT);

const authUrl = oauth2.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: SCOPES,
});

console.log('\n>>> Ouvre cette URL dans ton navigateur:\n');
console.log(authUrl);
console.log('\n>>> Choisis le compte Google qui a acces aux 7 proprietes Search Console.\n');

const server = http.createServer(async (req, res) => {
  try {
    const reqUrl = new URL(req.url, `http://localhost:${PORT}`);
    if (reqUrl.pathname !== '/oauth2callback') {
      res.writeHead(404).end('Not found');
      return;
    }
    const code = reqUrl.searchParams.get('code');
    if (!code) {
      res.writeHead(400).end('Pas de code');
      return;
    }
    const { tokens } = await oauth2.getToken(code);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(
      '<h1>OK</h1><p>Refresh token affiche dans le terminal. Tu peux fermer cet onglet.</p>'
    );

    console.log('\n=== TOKENS ===');
    if (!tokens.refresh_token) {
      console.log('PAS de refresh_token recu. Va dans https://myaccount.google.com/permissions, retire l\'app, et relance ce script.');
    } else {
      console.log('\nGOOGLE_REFRESH_TOKEN=' + tokens.refresh_token + '\n');
      console.log('Ajoute cette valeur dans:');
      console.log('  https://github.com/analytics-ds/pbn-dashboard/settings/secrets/actions');
      console.log('  Nom: GOOGLE_REFRESH_TOKEN');
    }
    setTimeout(() => server.close(() => process.exit(0)), 500);
  } catch (err) {
    console.error('Erreur:', err.message);
    res.writeHead(500).end('Erreur: ' + err.message);
    process.exit(1);
  }
});

server.listen(PORT, () => {
  console.log(`>>> Serveur d'attente sur ${REDIRECT}\n`);
});
