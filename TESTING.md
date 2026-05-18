# 🧪 TESTING

Ce document définit la stratégie globale de tests pour DataShare (backend + frontend).

## Objectif

Documenter le plan de test et les vérifications minimales à exécuter avant livraison.

## Architecture des tests (Monorepo)

```
DataShare/
├── backend/
│   ├── auth-core/               → Tests unitaires JWT
│   └── user-backend-app/        → Tests d'intégration Spring
├── frontend/
│   └── webapp/
│       ├── src/app/core/        → Unit tests (services, guards)
│       ├── src/app/pages/       → Integration tests (components)
│       └── src/app/functional/  → Functional tests
└── perf/                        → Performance tests (k6)
```

## Stratégie de tests

### Backend

- **Unitaires** (auth-core): Logique JWT, génération/validation de tokens
- **Intégration** (user-backend-app): Flux complets (login, fichiers, partage)
- **Couverture cible:** JaCoCo ≥ 70%

### Frontend

- **Unitaires:** Services (AuthService, FileService)
- **Composants:** Pages (Login, Upload, MySpace, etc.)
- **Fonctionnels:** Flux complets (authentification, upload/download)
- **E2E:** Playwright (smoke tests, full flows)
- **Couverture cible:** ≥ 70% (Functions)

### Performance

- **Charge:** k6 (simulations réalistes)
- **Lighthouse:** Qualité frontend (Accessibility, Performance, SEO)

## Cas critiques et critères d'acceptation

### Backend

| ID   | Fonctionnalité 			| Type 			| Critère d'acceptation 						|
|------|----------------------------|---------------|-----------------------------------------------|
| T-01 | Génération JWT 			| Unitaire		| Token retourné non vide 						|
| T-02 | Extraction login 			| Unitaire 		| Login extrait == utilisateur authentifié 		|
| T-03 | Validation token 			| Unitaire 		| isTokenValid retourne true 					|
| T-04 | Login API 					| Intégration 	| POST /api/login retourne 200 + token 			|
| T-05 | Accès protégé (valide) 	| Intégration 	| GET /api/me retourne 200 						|
| T-06 | Accès sans token 			| Intégration 	| GET /api/me retourne 401 						|
| T-07 | Upload fichier (valide)	| Intégration 	| POST /api/files retourne 200 					|
| T-08 | Upload sans token	 		| Intégration 	| POST /api/files retourne 401 					|
| T-09 | Upload vide 				| Intégration 	| POST /api/files retourne 400 					|
| T-10 | Upload trop volumineux 	| Intégration 	| POST /api/files retourne 413 					|
| T-11 | Upload type non autorisé 	| Intégration 	| POST /api/files retourne 415 					|
| T-12 | Partage public 			| Intégration 	| GET /api/files/shared/{token} retourne 200	|
| T-13 | Lien expiré 				| Intégration 	| GET /api/files/shared/{token} retourne 410 	|

### Frontend

| ID   | Fonctionnalité  | Type 		| Critère d'acceptation 						 |
|------|-----------------|--------------|------------------------------------------------|
| F-01 | Page Login 	 | Composant 	| Formulaire valide/invalide détecte les erreurs |
| F-02 | Page Register 	 | Composant 	| Création compte + validation mots de passe 	 |
| F-03 | Page Upload 	 | Composant 	| Upload fichier, validation taille/type 		 |
| F-04 | Page MySpace    | Composant 	| Affichage fichiers, filtres (actif/expiré) 	 |
| F-05 | Auth Flow 		 | Fonctionnel 	| Login → Dashboard → Upload → MySpace 			 |
| F-06 | JWT Interceptor | Unitaire 	| Token JWT injecté autormatiquement 			 |
| F-07 | Auth Guard 	 | Unitaire 	| Routes /dashboard protégées 					 |

## Commandes d'exécution

### Backend - Tests Unitaires + Intégration

```powershell
cd backend

# Tous les tests
mvn -f pom.xml clean test

# Module auth-core
mvn -f auth-core/pom.xml test

# Module user-backend-app
mvn -f user-backend-app/pom.xml test

# Avec rapport JaCoCo
mvn -f pom.xml clean verify
```

**Résultat attendu:** ✅ 44/44 tests PASSED

### Frontend - Tests Unitaires + Composants

```powershell
cd frontend/webapp

# CI mode (headless, une exécution)
npm run test:ci

# Watch mode (développement)
npm run test

# Coverage report
npm run test:ci -- --code-coverage
```

**Résultat attendu:** ✅ 88/88 tests PASSED, coverage ≥ 70%

### Frontend - E2E (Playwright)

```powershell
cd frontend/webapp

# Tous les E2E tests
npm run test:e2e

# Voir le rapport HTML
npx playwright show-report
```

**Résultat attendu:** ✅ 3/3 E2E tests PASSED (smoke, full-flow, accessibility)

### Performance - k6

```powershell
# Depuis la racine du projet
cd .

# Test LOGIN
$env:VUS="20"; $env:DURATION="1m"
k6 run perf/login_k6.js

# Test FILES
$env:VUS="10"; $env:DURATION="1m"
k6 run perf/files_k6.js
```

**Résultat attendu:** ✅ p95 < seuils, 0% erreurs

## État Actuel - Résultats 2026-05-10

### Backend ✅

```
Tests: 44/44 PASSED (100%)
├── auth-core: 8/8 ✅
└── user-backend-app: 36/36 ✅

Coverage JaCoCo: 70%+ ✅
Migrations Flyway: V1-V5 ✅
```

### Frontend ✅

```
Tests: 88/88 PASSED (100%)
├── Services: 28/28 ✅
├── Components: 59/59 ✅
└── Functional: 1/1 ✅

Coverage: 92.07% (Functions, integration) ✅ Cible: 70%
E2E: 5/5 ✅
```

### Performance ✅

```
LOGIN test:
  p95 = 104.32ms < 300ms ✅
  p99 = 138.69ms < 600ms ✅
  Error rate = 0% ✅

FILES test:
  p95 = 75.06ms < 500ms ✅
  p99 = 82.88ms < 1000ms ✅
  Error rate = 0% ✅
```

## Reset compte pour tests exploratoires

### Backend + Database

1. Démarrer Docker:
```powershell
docker compose up --build
```

2. Purger tous les comptes:
```powershell
docker exec datashare-postgres psql -U datashare -d datashare \
  -c "DELETE FROM users; SELECT COUNT(*) FROM users;"
```

3. Recréer un compte test via API:
```powershell
$body = '{"login":"test@datashare.local","password":"TestPass123!"}'
Invoke-RestMethod -Uri 'http://localhost:8080/api/register' `
  -Method Post -ContentType 'application/json' -Body $body

Invoke-RestMethod -Uri 'http://localhost:8080/api/login' `
  -Method Post -ContentType 'application/json' -Body $body
```

### Frontend - Développement

```powershell
cd frontend/webapp
npm start
# Accéder à http://localhost:4200
```

## Couverture de tests

### Backend - JaCoCo

- **Cible:** ≥ 70%
- **État:** ✅ Atteint (auth-core: 70%+, user-backend-app: 70%+)
- **Rapports:**
  - `backend/auth-core/target/site/jacoco/index.html`
  - `backend/user-backend-app/target/site/jacoco/index.html`

### Frontend - Karma

- **Cible:** ≥ 70%
- **État:** ✅ 92.07% (au-dessus de 70%)
- **Rapports:** `frontend/webapp/coverage/`
- **Suivi détaillé:** voir `frontend/webapp/TEST_SUMMARY.md`

## Prochaines améliorations prioritaires

### Immédiat (Backend) ✅ FAIT
- [x] 44/44 tests unitaires + intégration
- [x] JaCoCo 70%+
- [x] k6 benchmarks réussis

### Court terme (Frontend)
- [x] Augmenter coverage à 70%+ ✅
- [ ] Valider E2E contre API réelle (non mock)
- [ ] Tests d'accessibilité avancés
- [ ] Tests de timeout/network errors

### Moyen terme (Global)
- [ ] Scan CVE automatique en pipeline
- [ ] Tests de charge jusqu'à 100 VUS
- [ ] Documentation scénarios critiques
- [ ] Release testing procedure

---