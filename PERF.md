# 📊 PERF

Ce document docummente l'approche de vérification de performance pour le prototype DataShare (backend + frontend).

## Objectif

Établir des benchmarks de performance et des procédures de validation pour backend et frontend.

## Métriques à suivre

### Backend (API)

- Temps de réponse (`p95`, `p99`)
- Débit (req/s)
- Taux d'erreur
- Utilisation CPU/mémoire

### Frontend (Angular)

- Temps de chargement initial
- Temps d'interaction (FCP, LCP)
- Taille des bundles
- Temps de réponse des interactions utilisateur

## Endpoints critiques cibles (Backend)

- `POST /api/login`
- `GET /api/files?page=0&size=20`
- `POST /api/files` (upload)
- `GET /api/files/{storedFileName}` (download)
- `GET /api/files/shared/{token}` (partage public)

## Budget cible initial

### Backend API

- `POST /api/login`: **p95 < 300ms** (local), **p99 < 600ms**
- `/api/files` (liste/upload/download): **p95 < 500ms** (local), **p99 < 1000ms**
- Taux d'erreur: **< 1%**

### Frontend Angular

- Build bundle: **< 500KB** (gzipped)
- Temps de chargement page: **< 3s** (3G)
- Interaction TTI: **< 5s**

## Outils recommandés

### Backend
- **k6** (load testing - recommandé)
- Logs applicatifs structurés pour identifier goulots d'étranglement
- Docker Compose pour environnement local reproductible

### Frontend
- **Lighthouse** (Google Chrome DevTools)
- **Angular DevTools Profiler**
- `npm run build --prod` avec source map analysis

## Scripts k6 versionés

- `perf/login_k6.js`
- `perf/files_k6.js`

## État actuel - Benchmark 2026-05-08 ✅

### Backend: Tests k6 RÉUSSIS

**Environnement:** Docker Compose (PostgreSQL 16 + Spring Boot 3.5.5)
**Cible:** http://localhost:8080
**Date:** 2026-05-08
**k6 version:** v1.7.1

#### Test 1: Performance du LOGIN ✅

```
Configuration:
  VUS: 20
  Durée: 1 minute
  Endpoint: POST /api/login

Résultats:
  ✅ p(95) = 104.32ms < 300ms (seuil)
  ✅ p(99) = 138.69ms < 600ms (seuil)
  ✅ Taux d'erreur = 0.00% < 1% (seuil)
  
  Moyenne: 75.36ms
  Minimum: 62.65ms
  Maximum: 177.32ms
  
  Total requêtes: 1120
  Débit: 18.5 req/s
  Status 200: 100% (1120/1120)
```

#### Test 2: Performance des FICHIERS ✅

```
Configuration:
  VUS: 10
  Durée: 1 minute
  Endpoints:
    - POST /api/login
    - GET /api/files?page=0&size=20
    - POST /api/files (upload)
    - GET /api/files/{storedFileName} (download)

Résultats:
  ✅ p(95) = 75.06ms < 500ms (seuil)
  ✅ p(99) = 82.88ms < 1000ms (seuil)
  ✅ Taux d'erreur = 0.00% < 1% (seuil)
  
  Moyenne: 23.73ms
  Minimum: 1.51ms
  Maximum: 92.98ms
  
  Total requêtes HTTP: 2200
  Débit: 36.5 req/s
  Itérations complètes: 550
  Tous les checks: 100% (3850/3850)
```

**Rapport Détaillé:** voir `perf/REPORT_2026-05-08.md`

## Commandes pour reproduire les tests

### Backend - Test LOGIN

```powershell
cd backend
$env:BASE_URL="http://localhost:8080"
$env:LOGIN_USER="demo@datashare.local"
$env:LOGIN_PASSWORD="DemoPass123!"
$env:VUS="20"
$env:DURATION="1m"
k6 run ..\perf\login_k6.js
```

### Backend - Test FILES

```powershell
cd backend
$env:BASE_URL="http://localhost:8080"
$env:LOGIN_USER="demo@datashare.local"
$env:LOGIN_PASSWORD="DemoPass123!"
$env:VUS="10"
$env:DURATION="1m"
k6 run ..\perf\files_k6.js
```

### Frontend - Lighthouse

```powershell
cd frontend/webapp
npm run build --prod
# Ouvrir http://localhost:4200 dans Chrome
# Ctrl+Shift+I > Lighthouse > Generate report
```

## Format de résultat attendu (rendu)

Pour tout benchmark de performance:

- Date d'exécution du test
- Environnement (machine, JVM version, Node version)
- Paramètres de charge (VU, durée, payload)
- Métriques: p95, p99, req/s, taux d'erreur
- Conclusion: **conforme** / **non conforme** au budget cible
- ⚠️ Actions d'optimisation proposées

## État Frontend (Angular)

**Exécution du 2026-05-10:**
- Build: ✅ Sans erreurs
- Tests: 71/71 ✅ (couverture: 62.37%)
- Bundle size: À mesurer
- Performance: À valider avec Lighthouse

## Points d'optimisation identifiés

### Backend
- ✅ Excellent (~75ms moyenne login)
- 💡 Considérer caching pour endpoints statiques

### Frontend
- 🎯 Couverture tests: 62.37% → cible 70%
- 💡 Code splitting pour réduire bundle size
- 💡 Lazy loading des modules Angular

---

**Pour les détails techniques:**
- Backend: voir `backend/PERF.md`
- Frontend: voir `frontend/PERF.md` (si applicable)

