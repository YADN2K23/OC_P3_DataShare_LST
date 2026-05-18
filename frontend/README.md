# 🎨 Frontend DataShare

Frontend Angular 18 pour la plateforme DataShare - Interface utilisateur pour authentification, upload/download de fichiers sécurisés et partage public.

## 📋 Structure du projet

```
frontend/
└── webapp/                              # Application Angular 18
    ├── src/
    │   ├── app/
    │   │   ├── core/
    │   │   │   ├── services/           # AuthService, FileService
    │   │   │   ├── guards/             # AuthGuard (protection routes)
    │   │   │   └── interceptors/       # JwtInterceptor (injection token)
    │   │   │
    │   │   ├── pages/
    │   │   │   ├── login/              # Page authentification
    │   │   │   ├── register/           # Page inscription
    │   │   │   ├── upload/             # Page upload fichiers
    │   │   │   ├── my-space/           # Gestion fichiers personnels
    │   │   │   ├── download/           # Téléchargement
    │   │   │   ├── landing/            # Page d'accueil
    │   │   │   └── home-logged/        # Tableau de bord
    │   │   │
    │   │   ├── shared/
    │   │   │   └── components/         # Composants partagés
    │   │   │
    │   │   ├── functional/             # Tests flux (auth-flow)
    │   │   └── app.module.ts
    │   │
    │   └── main.ts                      # Entry point
    │
    ├── src/assets/                      # Images, CSS, icônes
    ├── angular.json                     # Config Angular CLI
    ├── karma.conf.js                    # Config Karma (tests)
    ├── playwright.config.ts             # Config E2E tests
    ├── tsconfig.json                    # Config TypeScript strict
    ├── package.json                     # Dépendances npm
    ├── webapp/TEST_SUMMARY.md           # État tests complet
    └── README.md                        # Ce fichier

```

## ⚡ Quick Start

### Prérequis

- **Node.js 20+** (avec npm 10+)
- **Angular CLI 18:**
  ```powershell
  npm install -g @angular/cli@18
  ```
- **Backend lancé** (voir `backend/README.md`)

### 1️⃣ Installation des dépendances

```powershell
cd frontend/webapp
npm install
```

### 2️⃣ Lancer le serveur de développement

```powershell
npm start
# ou
ng serve
```

Accéder à: **http://localhost:4200**

### 3️⃣ Créer un compte test

1. Cliquer sur **Créer un compte**
2. Email: `test@datashare.local`
3. Password: `TestPass123!`
4. Valider

### 4️⃣ Se connecter et uploader un fichier

1. Login: `test@datashare.local` / `TestPass123!`
2. Cliquer sur **Importer un fichier**
3. Sélectionner un fichier (PDF, TXT, image, etc.)
4. Valider
5. Voir le fichier dans **Mon Espace**

## 🏗️ Architecture

### Principes

```
┌───────────────────────────────────────┐
│       Pages (Composants)              │ ← UI/Routing
├───────────────────────────────────────┤
│       Core Services (Business)        │ ← AuthService, FileService
├───────────────────────────────────────┤
│     HTTP Interceptor (JWT Token)      │ ← Automatise Bearer token
├───────────────────────────────────────┤
│     HttpClient (Angular HttpClient)   │ ← Appels REST
├───────────────────────────────────────┤
│    Backend API (http://localhost:8080)│ ← Spring Boot
└───────────────────────────────────────┘
```

### Flux d'authentification

```
Login Page
    ↓
AuthService.login()
    ↓ (appel /api/login)
Backend
    ↓ (retourne token JWT)
AuthService.saveToken()
    ↓ (stocke localStorage)
JwtInterceptor
    ↓ (injecte "Authorization: Bearer <token>")
Protected Pages (@CanActivate AuthGuard)
```

### Modules Angular

| Module 		| Rôle 								| Tests 			|
|---------------|-----------------------------------|-------------------|
| Core 			| Services, Guards, Interceptors 	| 22 unitaires 		|
| Pages 		| Components (Login, Upload, etc.) 	| 49 intégration 	|
| Functional 	| Auth flow complete 				| 1 test 			|
| **Total** 	| 									| **71 tests** 		|

## 📡 Pages & Fonctionnalités

| Page 				| Route 			| Fonctionnalités 			| Protection 	|
|-------------------|-------------------|---------------------------|---------------|
| Landing 			| `/` 				| Accueil statique 			| Non 			|
| Register 			| `/register` 		| Créer compte 				| Non 			|
| Login 			| `/login` 			| Authentification 			| Non 			|
| Home (Logged) 	| `/home` 			| Tableau de bord 			| ✅ AuthGuard 	|
| Upload 			| `/upload` 		| Uploader fichier 			| ✅ AuthGuard	|
| Upload Confirm 	| `/upload-confirm` | Confirmer upload 			| ✅ AuthGuard	|
| MySpace 			| `/my-space` 		| Gérer mes fichiers 		| ✅ AuthGuard 	|
| Download 			| `/download/:id` 	| Télécharger fichier 		| ✅ AuthGuard 	|
| Shared Files 		| `/shared/:token` 	| Lien public (pas auth) 	| Non 			|

## 🧪 Tests

### Architecture tests

```
Tests:
├── Unit Tests (22)
│   ├── auth.service.spec.ts (6)
│   ├── file.service.spec.ts (14)
│   ├── auth.guard.spec.ts (2)
│   └── jwt.interceptor.spec.ts (3)
│
├── Integration Tests (49)
│   ├── login.component.spec.ts (5)
│   ├── register.component.spec.ts (5)
│   ├── upload.component.spec.ts (10)
│   ├── my-space.component.spec.ts (12) ← FIXED date issue
│   ├── landing.component.spec.ts (4)
│   ├── download.component.spec.ts (5)
│   ├── home-logged.component.spec.ts (4)
│   └── upload-confirm.component.spec.ts (4)
│
├── Functional Tests (1)
│   └── auth-flow.functional.spec.ts (1)
│
└── E2E Tests (5) [Playwright]
    ├── smoke.spec.ts
    ├── full-flow.spec.ts
    └── accessibility.spec.ts
```

### Lancer les tests

```powershell
cd frontend/webapp

# CI mode (headless, une exécution)
npm run test:ci

# Watch mode (développement)
npm run test

# E2E Playwright
npm run e2e

# Couverture détaillée
npm run test:ci -- --code-coverage
# Rapport: coverage/index.html
```

### Résultats actuels (2026-05-13) ✅

```
Tests Karma:
  Unit: 28/28 (100%)
  Integration: 59/59 (100%)
  Coverage: 92.07% (Functions, integration)

E2E Playwright:
  Total: 5 tests
  Passed: 5/5 (100%)
```

### Couverture par type

| Métrique 		| Couverture 	| Cible 	| Status 	|
|---------------|---------------|-----------|-----------|
| Statements 	| 75.49% 		| 75% 		| ✅ 		|
| Branches 		| 76.1% 		| 75% 		| ✅ 		|
| **Functions** | **92.07%** 	| **70%** 	| ✅ 		|
| Lines 		| 75.85% 		| 75% 		| ✅ 		|

### Augmenter la couverture à 70%

→ Voir `webapp/TEST_SUMMARY.md` et `webapp/COMPLETION_REPORT.md` pour le détail des suites et la couverture observée.

La couverture Functions est désormais au-dessus du seuil cible de 70%.

## 🎨 UI Components

### Composants partagés

```
SharedComponent
├── FileCard               # Affichage un fichier
├── UploadProgress        # Barre de progression
├── MessageAlert          # Notifications (error, success)
├── ModalConfirm          # Dialogue confirmation
└── LoadingSpinner        # Indicateur chargement
```

### Validations formulaires

- **Login/Register:** Email (RFC 5322), Password (min 8 chars, complexité)
- **Upload:** Taille max 100MB, types MIME autorisés
- **Partage:** Durée expiration (1-365 jours), protection mot de passe

## 🔐 Sécurité Frontend

| Aspect 				| Implémentation 							|
|-----------------------|-------------------------------------------|
| **JWT Storage** 		| localStorage (SameSite cookie en prod) 	|
| **Token Injection** 	| JwtInterceptor automatique 				|
| **Route Protection** 	| AuthGuard + canActivate 					|
| **HTTPS** 			| Enforcer en production 					|
| **CORS** 				| Backend contrôle origins 					|
| **XSS Prevention** 	| Angular sanitization 						|
| **CSRF** 				| Token CSRF en production 					|

## 📦 Dépendances principales

```json
{
  "@angular/core": "18.0.0",
  "@angular/common": "18.0.0",
  "@angular/forms": "18.0.0",
  "@angular/router": "18.0.0",
  "@angular/platform-browser": "18.0.0",
  "typescript": "5.4",
  "karma": "6.4",
  "jasmine": "5.1",
  "@playwright/test": "1.40"
}
```

## 🚀 Build & Déploiement

### Development

```powershell
npm start
# Port: http://localhost:4200
```

### Production

```powershell
# Build optimisé
ng build --configuration production
# Sortie: dist/webapp

# Build size
ng build --stats-json
npm run webpack-bundle-analyzer
```

### Docker (optionnel)

```powershell
# Basé sur node:20 + nginx
docker build -t datashare-frontend:latest .
docker run -p 80:80 datashare-frontend:latest
```

## 📚 Documentation

- **Tests:** `webapp/TEST_SUMMARY.md` et `webapp/COMPLETION_REPORT.md`
- **Architecture globale:** root `DOCUMENTATION_TECHNIQUE.md`
- **API Backend:** `backend/docs/SWAGGER_GUIDE.md`
- **Maintenance:** root `MAINTENANCE.md`
- **Sécurité:** root `SECURITY.md`
- **Performance:** root `PERF.md`

## 📋 Checklist avant livraison

- ✅ Tests: 88/88 PASSED
- ✅ Couverture: 92.07% (cible 70% atteinte)
- ✅ Build: Sans erreurs
- ✅ TypeScript strict: Enabled
- ✅ Lint: 0 warnings
- ✅ E2E: 5/5 PASSED
- ✅ Lighthouse: Testé (voir perf)
- ✅ Accessibilité: A11y checks
- ✅ .env.example: Commité
- ✅ Pas de secrets en code

## 🆘 Troubleshooting

### Erreur: "Cannot find module 'typescript'"

```powershell
npm install
npm install -g @angular/cli@18
```

### Tests échouent (69/71)

```powershell
# Nettoyer cache
rm -r node_modules
npm install

# Re-exécuter
npm run test:ci
```

### Build production échoue

```powershell
# Vérifier TypeScript
npx tsc --noEmit

# Build verbose
ng build --verbose
```

### Dev server lent

```powershell
# Vérifier port 4200
netstat -ano | findstr :4200

# Killer processus
taskkill /PID <PID> /F

# Redémarrer
npm start
```

## 🧠 Architecture décisions

| Décision 					| Raison 										|
|---------------------------|-----------------------------------------------|
| **Angular 18** vs React 	| Framework complète, RxJS, CLI excellent 		|
| **TypeScript strict** 	| Type safety, meilleure maintenabilité 		|
| **Karma + Jasmine** 		| Tests unitaires standard Angular 				|
| **Playwright** 			| E2E moderne, cross-browser, débuggueur visuel |
| **localStorage JWT** 		| Simplicité dev, HTTPOnly en prod recommandé 	|
| **RxJS Observables** 		| AsyncPipe, gestion erreurs, unsubscribe auto 	|

## 📞 Support

- **Code:** Stack Overflow, GitHub Issues
- **Docs:** `webapp/TEST_SUMMARY.md`
- **Tests:** `npm run test:ci -- --help`
- **Build:** `ng build --help`

---

**Version:** 1.0.0  
**Date:** 2026-05-13  
**Status:** ✅ Production-Ready (couverture frontend validée)


