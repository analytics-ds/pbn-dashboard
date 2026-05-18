# PBN Dashboard

Dashboard d'un coup d'oeil pour 7 sites PBN: Search Console (clics / impressions / position / top pages avec variation S vs S-1) + nombre d'articles publies sur les 7 derniers jours.

- Genere par GitHub Actions chaque jour (cron 7h UTC)
- Site statique servi par GitHub Pages
- Zero serveur, zero base de donnees

## Setup credentials (a faire une fois)

### 1. Google Cloud + Search Console API

1. Va sur https://console.cloud.google.com/projectcreate et cree un projet (ou reutilise un existant).
2. Active l'API Search Console: https://console.cloud.google.com/apis/library/searchconsole.googleapis.com
3. OAuth consent screen: https://console.cloud.google.com/apis/credentials/consent
   - User Type: External
   - Publishing status: peut rester en Testing si tu t'ajoutes en test user
   - Ajoute ton email Google (celui qui a acces aux 7 proprietes GSC) en test user
4. Cree des credentials OAuth: https://console.cloud.google.com/apis/credentials
   - Create Credentials > OAuth client ID
   - Application type: **Desktop app**
   - Note le `client_id` et le `client_secret`

### 2. Recuperer un refresh_token (local)

```bash
git clone https://github.com/analytics-ds/pbn-dashboard.git
cd pbn-dashboard
npm ci

export GOOGLE_CLIENT_ID="ton-client-id.apps.googleusercontent.com"
export GOOGLE_CLIENT_SECRET="ton-client-secret"
npm run get-refresh-token
```

Ouvre l'URL imprimee, login avec le compte Google qui a acces aux 7 proprietes Search Console, accepte. Le refresh token s'affichera dans le terminal.

### 3. GitHub PAT pour compter les articles

Cree un fine-grained Personal Access Token: https://github.com/settings/personal-access-tokens/new

- Resource owner: `analytics-ds`
- Repository access: Only select repositories > selectionne les 7 repos PBN
- Permissions > Repository > **Contents: Read**
- Genere et copie le token

### 4. Mettre les secrets dans le repo

https://github.com/analytics-ds/pbn-dashboard/settings/secrets/actions

Ajouter 4 secrets:

| Nom | Valeur |
|---|---|
| `GOOGLE_CLIENT_ID` | Le client ID OAuth |
| `GOOGLE_CLIENT_SECRET` | Le client secret OAuth |
| `GOOGLE_REFRESH_TOKEN` | Le refresh token recupere a l'etape 2 |
| `GH_API_TOKEN` | Le fine-grained PAT de l'etape 3 |

### 5. Activer GitHub Pages

https://github.com/analytics-ds/pbn-dashboard/settings/pages

- Source: **GitHub Actions**

### 6. Lancer un premier build

https://github.com/analytics-ds/pbn-dashboard/actions/workflows/build.yml > **Run workflow**

Le dashboard sera publie sur https://analytics-ds.github.io/pbn-dashboard/

## Ajouter / modifier un site

Editer `src/sites.js`, commit, push. Le prochain build prendra en compte la modif.

## Notes

- Le dashboard utilise la donnee GSC des 7 derniers jours **finalisee** (J-8 a J-2) car GSC a un retard de 2-3 jours sur la donnee fraiche.
- Comparaison: vs les 7 jours precedents (J-15 a J-9).
- Le compteur d'articles regarde les fichiers `.md` **ajoutes** dans le dossier `articlesPath` de chaque repo sur les 7 derniers jours (commits avec status `added`, hors `_index.md`).
