# DataShare

Plateforme complète de partage de fichiers sécurisée. Repo parent pour la coordination globale du projet.

## 🚀 Démarrage rapide

1. Lire `CONTRIBUTING.md` (règles de contribution)
2. Lire `DOCUMENTATION_TECHNIQUE.md` (architecture complète)
3. Voir `backend/README.md` pour démarrage backend
4. Voir `frontend/README.md` pour démarrage frontend

## 📚 Références principales

| Document 						| Description 									|
|-------------------------------|-----------------------------------------------|
| `README.md` 					| Ce fichier - Vue d'ensemble projet 			|
| `DOCUMENTATION_TECHNIQUE.md` 	| Architecture, tech choices, API, security 	|
| `CONTRIBUTING.md` 			| Règles contribution + conventions 			|
| `SECURITY.md` 				| Politique et mesures de sécurité 				|
| `TESTING.md` 					| Stratégie tests (backend + frontend) 			|
| `PERF.md` 					| Benchmarks performance (k6 results) 			|
| `MAINTENANCE.md` 				| Procédures ops et maintenance 				|
| `CHANGELOG.md` 				| Historique releases 							|

## 📁 Structure racine

```
DataShare/
├── README.md                    ← Vue d'ensemble (vous êtes ici)
├── DOCUMENTATION_TECHNIQUE.md   ← Architecture générale
├── CONTRIBUTING.md              ← Comment contribuer
├── SECURITY.md                  ← Politique sécurité
├── TESTING.md                   ← Stratégie tests globale
├── PERF.md                      ← Performance benchmarks
├── MAINTENANCE.md               ← Maintenance ops
├── CHANGELOG.md                 ← Historique
│
├── backend/                     ← Spring Boot 3.5.5
│   ├── README.md               ← Spécificités backend
│   ├── compose.yaml            ← Docker Compose (PostgreSQL + Backend)
│   ├── pom.xml                 ← Maven config
│   ├── auth-core/              ← Module JWT réutilisable
│   ├── user-backend-app/       ← Logique métier
│   └── docs/                   ← Documentation API
│
└── frontend/                    ← Angular 18
    ├── README.md               ← Spécificités frontend
    ├── webapp/                 ← Application Angular
    │   ├── package.json
    │   ├── angular.json
    │   └── src/
    └── [assets]
```

---

## ✨ Caractéristiques principales

### 🔐 Backend (Spring Boot 3.5.5)
- ✅ **Authentification JWT** stateless HS256
- ✅ **API REST** avec 10 endpoints documentés
- ✅ **PostgreSQL 16** + Flyway migrations
- ✅ **Stockage fichiers** sur volume persistant Docker
- ✅ **Sécurité** : BCrypt, CORS, rate limiting, validation entrées
- ✅ **Tests** : 44/44 ✅ (unitaires + intégration)
- ✅ **Documentation API** : `backend/docs/SWAGGER_GUIDE.md`

### 🎨 Frontend (Angular 18)
- ✅ **Interface responsive** design moderne
- ✅ **Services** : AuthService, FileService
- ✅ **JWT authentication** localStorage + HttpInterceptor
- ✅ **Guards** : Protection routes authentifiées
- ✅ **Upload** : limite frontend strictement inférieure à 1 Go
- ✅ **Tests** : suites frontend et backend validées, avec couverture frontend au-dessus du seuil cible
- ✅ **Coverage** : frontend Functions > 70% (dernier run validé: 92.07%)

### 🐳 DevOps
- ✅ **Docker Compose** : Stack complète (PostgreSQL + Backend)
- ✅ **Dockerfiles** : Backend + Frontend production-ready
- ✅ **CI/CD ready** : GitHub Actions config
- ✅ **Environments** : Dev, Test, Prod configurations

---

## ⚙️ Installation

### Prérequis

| Composant 			| Minimum 	| Recommandé 	|
|-----------------------|-----------|---------------|
| **Java** 				| 21 JDK 	| Java 21+ 		|
| **Maven** 			| 3.9+ 		| 3.9.6+ 		|
| **Node.js** 			| 18 LTS 	| 20 LTS 		|
| **npm** 				| 9+ 		| 10+ 			|
| **Docker** 			| 24+ 		| 24.0.x 		|
| **Docker Compose** 	| 2.20+ 	| 2.24+ 		|

### Vérifier les prérequis

```bash
java -version          # → java 21.x.x
mvn -version           # → Maven 3.9.x
node -v && npm -v      # → v18+, 9+
docker -v              # → Docker 24.x
docker-compose -v      # → v2.20+
```

### Installation en 3 étapes

#### 1️⃣ Cloner le repository

```bash
git clone https://github.com/YADN2K23/OC_P3_DataShare.git
cd DataShare
```

#### 2️⃣ Installer Backend

```bash
cd backend
mvn clean install

# Cela va :
# ✅ Télécharger dépendances Maven
# ✅ Compiler modules auth-core + user-backend-app
# ✅ Exécuter 44 tests unitaires
```

#### 3️⃣ Installer Frontend

```bash
cd ../frontend/webapp
npm install
npx playwright install chromium
```

✅ **Installation terminée !**

---

## 🚀 Lancement

### ⭐ Option 1 : Docker Compose (RECOMMANDÉE)

Stack complet : PostgreSQL 16 + Spring Boot + Angular

```bash
# Terminal 1 : Backend + PostgreSQL
docker compose -f backend/compose.yaml up --build

# Résultat :
# ✅ PostgreSQL 16 : localhost:5432
# ✅ Backend : http://localhost:8080
# ✅ API : http://localhost:8080/api
```

```bash
# Terminal 2 : Frontend
cd frontend/webapp
npm start

# Frontend : http://localhost:4200
```

### ⭐ Option 2 : Local (sans Docker)

Prérequis : PostgreSQL 16 installé localement

```bash
# Terminal 1 : Backend
cd backend
export JWT_SECRET="mon-secret-32-caracteres-minimum"
export POSTGRES_USER="datashare"
export POSTGRES_PASSWORD="MyPassword123!"
mvn -f user-backend-app/pom.xml spring-boot:run

# Terminal 2 : Frontend
cd frontend/webapp
npm start
```

### ⏹️ Arrêter les services

```bash
# Docker Compose
docker compose -f backend/compose.yaml down

# Nettoyer volumes
docker compose -f backend/compose.yaml down -v
```

---

## 📖 Utilisation

### ⚡ Quick Start - Compte Demo

Après avoir lancé Docker Compose, créez un compte de démonstration :

```bash
# Créer le compte demo
curl -X POST http://localhost:8080/api/register \
  -H "Content-Type: application/json" \
  -d '{"login": "demo@datashare.local", "password": "DemoPass123!"}'

# Réponse (HTTP 204) : Compte créé ✅
```

**Ensuite accédez à :**
- 🌐 **Frontend** : http://localhost:4200
- 🔐 **Login** : `demo@datashare.local`
- 🔑 **Password** : `DemoPass123!`

Ou testez directement l'authentification :

```bash
curl -X POST http://localhost:8080/api/login \
  -H "Content-Type: application/json" \
  -d '{"login": "demo@datashare.local", "password": "DemoPass123!"}'

# Réponse :
# {"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", "expiresIn": 86400}
```

---

### 🔑 Création compte et authentification

```bash
# Créer un compte
curl -X POST http://localhost:8080/api/register \
  -H "Content-Type: application/json" \
  -d '{"login": "alice@example.com", "password": "SecurePass123!"}'

# Se connecter
curl -X POST http://localhost:8080/api/login \
  -H "Content-Type: application/json" \
  -d '{"login": "alice@example.com", "password": "SecurePass123!"}'

# Réponse :
# {"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", "expiresIn": 3600}
```

### 📤 Upload fichier

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X POST http://localhost:8080/api/files \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@document.pdf"

# Réponse :
# {"storedFileName": "abc123-def456.pdf", "originalName": "document.pdf", "size": 1024000}
```

### 📥 Télécharger fichier

```bash
curl -X GET http://localhost:8080/api/files/abc123-def456.pdf \
  -H "Authorization: Bearer $TOKEN" \
  -o document.pdf
```

### 🔗 Créer lien de partage public

```bash
curl -X POST http://localhost:8080/api/files/abc123-def456.pdf/shares \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"expiresIn": 604800}' # 7 jours

# Réponse :
# {"shareUrl": "http://localhost:8080/api/files/shared/xyz789...", "expiresAt": "2026-05-17T..."}
```

### 📋 Flux complet

```
Landing page (public)
    ↓
S'inscrire / Se connecter
    ↓
Tableau de bord (My Space)
    ├─ Voir mes fichiers
    ├─ Uploader nouveau fichier
    └─ Créer liens de partage
    ↓
Partager lien public avec d'autres
    ↓
Se déconnecter
```

---

## 🏗️ Architecture

### Diagramme 3 couches

```
┌─────────────────────────────────────────────┐
│ FRONTEND - Angular 18 (:4200)               │
│ ├─ Pages : Landing, Login, Upload, MySpace  │
│ ├─ Services : AuthService, FileService      │
│ └─ Guards : AuthGuard + JwtInterceptor      │
└────────┬────────────────────────────────────┘
         │ HTTP/REST + JWT
         ↓
┌─────────────────────────────────────────────┐
│ BACKEND - Spring Boot 3.5.5 (:8080/api)     │
│ ├─ Controllers : Auth, Files, Shares        │
│ ├─ Services : LogicJPA métier               │
│ └─ Security : JWT Filter + CORS             │
└────────┬────────────────────────────────────┘
         │ SQL/JPA
         ↓
┌─────────────────────────────────────────────┐
│ DATABASE - PostgreSQL 16 (:5432)            │
│ ├─ Tables : users, file_assets, share_links │
│ ├─ Migrations : Flyway                      │
│ └─ Volume : /data/uploads (fichiers)        │
└─────────────────────────────────────────────┘
```

---

## 🧪 Tests

### Backend (44 tests ✅)

```bash
cd backend

# Tous les tests
mvn clean test

# Résultats : 44/44 PASSED ✅
# - auth-core : 8 tests
# - user-backend-app : 36 tests
# JaCoCo Coverage : 70%+
```

### Frontend (88 tests ✅)

```bash
cd frontend/webapp

# Pipeline complète (comme CI)
npm run test:ci

# Résultats : 88/88 PASSED ✅
# - Unit tests : 28
# - Integration tests : 59
# - Functional tests : 1
# Coverage : 92.07% (target: 70% atteint)
```

### Détail des tests

| Suite 							| Count 	| Status 		| Coverage 						|
|-----------------------------------|-----------|---------------|-------------------------------|
| **Backend - auth-core** 			| 8 		| ✅ PASS 		| JWT token generation 			|
| **Backend - user-backend-app** 	| 36 		| ✅ PASS 		| Auth flow, Files, Shares 		|
| **Frontend - Services** 			| 22 		| ✅ PASS 		| AuthService, FileService 		|
| **Frontend - Components** 		| 49 		| ✅ PASS 		| Login, Upload, MySpace, etc 	|
| **TOTAL** 						| **115** 	| **✅ 100%** 	| **Excellent** 				|

---

## ⚡ Performance

### Résultats k6 (2026-05-08) ✅

#### Test 1 : Login (20 VUS)
```
✓ p(95) = 104.32ms  < 300ms  ✅
✓ p(99) = 138.69ms  < 600ms  ✅
✓ Error rate = 0%   < 1%     ✅
✓ Débit = 18.5 req/s
```

#### Test 2 : Files cycle (10 VUS)
```
✓ p(95) = 75.06ms   < 500ms  ✅
✓ p(99) = 82.88ms   < 1000ms ✅
✓ Error rate = 0%   < 1%     ✅
✓ Débit = 36.5 req/s
```

**Conclusion** : ✅ **PRÊT POUR PRODUCTION**

Voir `PERF.md` pour détails complets

---

## 🔐 Sécurité

### Mesures en place

| Mesure 					| Description 							|
|---------------------------|---------------------------------------|
| **JWT HS256** 			| Authentification stateless 			|
| **BCrypt** 				| Hashage mots de passe (cost: 10) 		|
| **CORS** 					| Restreint domaines autorisés 			|
| **Rate Limiting** 		| 5 tentatives login / 15 min 			|
| **Validation entrées** 	| Côté serveur obligatoire 				|
| **Content-Type** 			| Validation MIME + signature fichiers 	|

### CVE Scan

```
✅ 0 CVE détectées (Scan 2026-05-08)
✅ Dépendances à jour
```

Voir `SECURITY.md` pour détails

---

## 📚 Documentation

| Fichier 							| Description 							|
|-----------------------------------|---------------------------------------|
| **README.md** 					| Vue d'ensemble (ce fichier) 			|
| **backend/README.md** 			| Quick start backend 					|
| **frontend/README.md** 			| Quick start frontend 					|
| **DOCUMENTATION_TECHNIQUE.md** 	| Architecture complète (1200+ lignes) 	|
| **TESTING.md** 					| Plans + résultats tests 				|
| **PERF.md** 						| Benchmarks performance k6 			|
| **SECURITY.md** 					| Politique et contrôles 				|
| **MAINTENANCE.md** 				| Procédures ops 						|
| **CONTRIBUTING.md** 				| Règles contribution 					|

### Documentation API

**Swagger UI** : http://localhost:8080/swagger-ui.html

- ✅ 10 endpoints REST documentés
- ✅ Modèles JSON schémas
- ✅ Try-it-out fonctionnel

---

## 🐛 Dépannage

**Q: Le backend ne démarre pas**
```bash
# Vérifier port 8080 libre
lsof -i :8080

# Logs
docker compose -f backend/compose.yaml logs backend

# Reset DB
docker compose -f backend/compose.yaml down -v
```

**Q: Frontend n'accède pas à l'API**
```bash
# Vérifier backend actif
curl http://localhost:8080/api/login

# Vérifier configuration CORS backend
# Voir environment.ts frontend
```

**Q: Tests échouent**
```bash
# Frontend : installer Playwright
npx playwright install chromium

# Backend : dépendances du cache Maven
mvn clean install
```

Voir `DOCUMENTATION_TECHNIQUE.md` pour troubleshooting complet

---

## 🔄 Workflow Git

### Conventions

- **Branches** : `feature/*`, `fix/*`, `docs/*`
- **Commits** : Conventional Commits (`feat:`, `fix:`, `docs:`)
- **PR** : Une fonctionnalité / PR

### Commandes utiles

```bash
# Cloner
git clone https://github.com/YADN2K23/OC_P3_DataShare.git

# Feature
git checkout -b feature/ma-feature
git add .
git commit -m "feat(auth): add JWT refresh endpoint"
git push -u origin feature/ma-feature

# Create PR sur GitHub
```

### Hooks pre-commit

```bash
# Activer
git config core.hooksPath scripts

# Teste : crée fichier avec espaces en fin,
# commit doit être bloqué
```

---

## 📊 État du projet

### ✅ **PRODUCTION READY**

```
Frontend Angular 18        : ✅ READY (71 tests ✅)
Backend Spring Boot 3.5.5  : ✅ READY (44 tests ✅)
PostgreSQL 16              : ✅ READY (volume persistant)
Docker Compose             : ✅ READY (stack complète)
Tests                      : ✅ 115/115 PASSED (100%)
Performance                : ✅ SLA atteints (k6 2026-05-08)
Sécurité                   : ✅ 0 CVE detéctées
Documentation              : ✅ Complète (6 fichiers)

DevOps avancé (Kubernetes) : ⏳ TODO (prochaine phase)
CI/CD GitHub Actions       : ⏳ TODO (prochaine phase)
Monitoring (Prometheus)    : ⏳ TODO (phase avancée)
```

---

## 📞 Support

### Bugs et problèmes

1. Ouvrir une issue : https://github.com/YADN2K23/OC_P3_DataShare/issues
2. Inclure : OS, version, logs d'erreur
3. Faire PR avec correction

### Questions

- Consulter `DOCUMENTATION_TECHNIQUE.md`
- Voir `docs/` pour détails architectures
- Lire logs : `docker compose logs -f`

---

## 📜 License

MIT License. Voir `LICENSE` pour détails.

---

## 👤 Crédits

- **Développement** : Youssef Adnane (ia-assisted)
- **Architecture**  : Youssef Adnane (ia-assisted)
- **Documentation** : Youssef Adnane (ia-assisted)

---

## 🎯 Prochaines étapes

- [ ] Phase 2 : Kubernetes manifests
- [ ] Phase 3 : CI/CD GitHub Actions
- [ ] Phase 4 : Monitoring + Alerting
- [ ] Phase 5 : Multi-régions deployment

---

**Dernière mise à jour** : 10 mai 2026  
**Version** : 1.0.0  
**État** : ✅ **PRODUCTION READY**

---

## 📌 Raccourcis rapides

```bash
# Backend
docker compose -f backend/compose.yaml up --build  # Démarrer
cd backend && mvn clean test                        # Tests

# Frontend
cd frontend/webapp && npm start                     # Dev server
npm run test:ci                                     # Tests

# Both
cd frontend/webapp && npm start &
docker compose -f backend/compose.yaml up --build  # Complète
```

**API** : http://localhost:8080/api  
**Frontend** : http://localhost:4200  
**Swagger** : http://localhost:8080/swagger-ui.html  
**PostgreSQL** : localhost:5432

