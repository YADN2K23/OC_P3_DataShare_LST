# DataShare Webapp (Angular)

Frontend Angular connecté au backend Spring Boot. UI basée sur template `../datashare.html` et exports `../Figma/`.

## Pages disponibles

- `/` : landing page (public)
- `/login` : connexion (public)
- `/register` : inscription (public)
- `/upload` : téléversement (protégé)
- `/download` : téléchargement (public)
- `/my-space` : espace utilisateur (protégé)

## Installation locale

```bash
npm install
```

## Lancer en dev (frontend seul)

```bash
npm start
```

Puis ouvrir `http://localhost:4200` (l'API doit tourner sur `http://localhost:8080/api`).

## Lancer backend + frontend (recommande)

Depuis la racine du workspace :

```bash
docker compose -f datashare-backend/compose.yaml up --build
```

Puis, dans `datashare-frontend/webapp` :

```bash
npm start
```

Ensuite ouvrir `http://localhost:4200`.

### Configuration Docker Compose backend

Le fichier `datashare-backend/compose.yaml` lance :
- Backend: `http://localhost:8080`
- PostgreSQL: `localhost:5432`

## Build production

```bash
npm run build
```

Output: `dist/webapp/`

## Sprint 3 DevOps

### CI GitHub Actions

Workflow ajoute dans `../.github/workflows/frontend-ci.yml` avec :
- build Angular
- tests CI (`test:unit`, `test:integration`, `test:functional`, `test:e2e` via `test:ci`)
- publication des artefacts (`playwright-report`, `test-results`)

Le pipeline est decoupe en jobs separes (`build`, `unit`, `integration`, `functional`, `e2e`, `docker-build`) pour isoler les erreurs plus vite.

### Containerisation frontend (Nginx)

Fichiers ajoutes :
- `Dockerfile` (multi-stage: build Angular + runtime Nginx)
- `nginx.conf` (fallback SPA)
- `.dockerignore`

Scripts npm:

```bash
npm run docker:build
npm run docker:run
```

Puis ouvrir `http://localhost:4200`.

Si Docker Desktop n'est pas demarre, `npm run docker:build` echouera tant que le daemon Docker n'est pas disponible.

### Routing SPA en production

La config Nginx applique:

```nginx
try_files $uri $uri/ /index.html;
```

Ce fallback permet le refresh direct des routes Angular (`/login`, `/register`, `/my-space`, etc.).

## Tests (Phase 3)

📊 **État détaillé des tests** : Voir `../FRONTEND_TESTS_STATUS.md`

### Installer les dépendances de test

```bash
npm install
npx playwright install chromium
```

### Tests unitaires

```bash
npm run test:unit
```

Sous Windows (si Chrome n'est pas installe globalement), definir `CHROME_BIN` vers Chromium Playwright avant les tests Karma:

```powershell
$env:CHROME_BIN = "$env:LOCALAPPDATA\ms-playwright\chromium-1217\chrome-win64\chrome.exe"
```

### Tests d'intégration

```bash
npm run test:integration
```

### Tests fonctionnels

```bash
npm run test:functional
```

### Tests E2E

```bash
npm run test:e2e
```

### Pipeline locale complète

```bash
npm run test:ci
```

## Architecture

```
src/
├── app/
│   ├── core/
│   │   ├── guards/      (AuthGuard)
│   │   ├── interceptors/ (JwtInterceptor)
│   │   ├── models/      (Interfaces TypeScript)
│   │   └── services/    (AuthService, FileService)
│   ├── pages/           (Landing, Login, Register, Upload, Download, MySpace)
│   └── app.routes.ts    (Routing)
├── environments/        (Configs: dev/prod)
└── styles.scss          (Styles globaux)
```

## Services backend requis

```
POST   /api/register                         → Create user
POST   /api/login                            → Get JWT token
GET    /api/me                               → Current user info
GET    /api/files                            → List owned files
GET    /api/files/history                    → List file history
POST   /api/files                            → Upload file
GET    /api/files/{storedFileName}           → Download private file
DELETE /api/files/{storedFileName}           → Delete file
POST   /api/files/{storedFileName}/shares    → Create share link
GET    /api/files/shared/{token}             → Download shared file
```

## Intégration backend

✅ Authentification (login/register)
✅ Upload / download / suppression de fichiers
✅ Gestion des tokens JWT
✅ Listing des fichiers et historique
✅ Liens de partage public

## Variables d'environnement

Créer un `.env` (frontend) si besoin :

```
JWT_SECRET=your-secret-key-here
API_URL=http://localhost:8080/api
```

## Prochaines étapes

- [ ] Intégration listing fichiers dans `/my-space`
- [ ] Amélioration UI (design Figma pixel-perfect)
- [x] Phase 3 tests (unitaires, intégration, fonctionnels, E2E Playwright)
- [ ] Déploiement Kubernetes + CI/CD

