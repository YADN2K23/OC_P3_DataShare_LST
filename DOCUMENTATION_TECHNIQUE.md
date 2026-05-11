# 📚 Documentation Technique - DataShare

**Date de compilation** : 15 avril 2026  
**Statut** : Phase Backend + Frontend complétée ✅  
**Version** : 1.0.0  

---

## 📑 Table des matières

1. [Architecture de l'application](#1-architecture-de-lapplication)
2. [Choix technologiques justifiés](#2-choix-technologiques-justifiés)
3. [Modèle de données](#3-modèle-de-données)
4. [Documentation d'API](#4-documentation-dapi)
5. [Sécurité et gestion des accès](#5-sécurité-et-gestion-des-accès)
6. [Qualité, tests et maintenance](#6-qualité-tests-et-maintenance)
7. [Processus d'installation et d'exécution](#7-processus-dinstallation-et-dexécution)
8. [Utilisation de l'IA dans le développement](#8-utilisation-de-lia-dans-le-développement)

---

## 1. Architecture de l'application

### Vision globale

DataShare est une **plateforme de transfert de fichiers sécurisée** composée de trois briques principales :

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND ANGULAR                            │
│  (Landing, Login, Register, Upload, Download, MySpace)          │
│              http://localhost:4200                              │
└────────────────────────┬────────────────────────────────────────┘
                         │ (HTTP/REST + JWT)
                         │
┌────────────────────────▼────────────────────────────────────────┐
│              BACKEND SPRING BOOT (JWT)                          │
│  - auth-core (librairie JWT réutilisable)                       │
│  - user-backend-app (logique applicative)                       │
│              http://localhost:8080/api                          │
└────────────────────────┬────────────────────────────────────────┘
                         │ (SQL)
                         │
┌────────────────────────▼────────────────────────────────────────┐
│     POSTGRESQL 16 + STOCKAGE FICHIERS (modèle cible documenté)  │
│  - Modèle relationnel : users, file_assets, share_links (docs)  │
│  - Implémentation actuelle : métadonnées en fichiers locaux     │
│  - Binaires des fichiers : volume Docker persistant             │
│             localhost:5432                                      │
└─────────────────────────────────────────────────────────────────┘
```

### Composants détaillés

#### **Frontend Angular**
- **Framework** : Angular 18+
- **Pages** :
  - `/` : Landing page (public)
  - `/login` : Authentification
  - `/register` : Création de compte
  - `/upload` : Téléversement de fichiers (protégé)
  - `/my-space` : Espace utilisateur (protégé)
  - `/download` : Téléchargement de fichiers partagés
- **Services** :
  - `AuthService` : gestion login/register/logout/getMe
  - `FileService` : upload/download/delete/createShareLink
  - `JwtInterceptor` : ajoute `Authorization: Bearer <token>` à chaque requête
  - `AuthGuard` : protège les routes par authentification

#### **Backend Spring Boot (2 modules Maven)**

**Module `auth-core`** (librairie réutilisable)
- Configuration JWT (secret, expiration)
- Génération et validation de tokens
- Filtre JWT HTTP
- Auto-configuration Spring Boot

**Module `user-backend-app`** (logique métier)
- Endpoints d'authentification (`/api/login`, `/api/register`, `/api/me`)
- Endpoints de gestion de fichiers (`POST /api/files`, `GET /api/files`, `DELETE /api/files/{id}`)
- Endpoints de partage (`POST /api/files/{id}/shares`, `GET /api/files/shared/{token}`)
- Persistance PostgreSQL via Spring Data JPA
- Migrations de schéma via Flyway

#### **Base de données PostgreSQL 16**
- **Modèle cible documenté** : Entités `users`, `file_assets`, `share_links` (schéma relationnel complet)
- **Implémentation actuelle** : Métadonnées fichiers stockées localement en `.properties`; structure SQL disponible mais métadonnées métier non encore entièrement migrées vers la persistance ORM
- Migrations versionnées via Flyway
- Voir `docs/data-model.md` pour la distinction détaillée

#### **Stockage fichiers**
- Volume Docker pour persistance entre redémarrages
- Chemin : `/data/uploads` (configurable)

### Architecture techniques

**Diagrammes disponibles** :
- `datashare-backend/docs/architecture.md` : architecture modulaire backend
- `Schémas d'architecture/01_architecture_globale.svg` : vue d'ensemble
- `Schémas d'architecture/html-alignes/01_architecture_globale.html` : version interactive

---

## 2. Choix technologiques justifiés

### Récapitulatif des choix

| Composant | Technologie | Alternatives | Justification |
|-----------|-------------|--------------|---------------|
| **Framework backend** | Spring Boot 3.5.5 | Node.js, Django, ASP.NET | Stabilité, ecosystème Maven riche, testabilité, architecture modulaire |
| **Authentification** | JWT (JSON Web Token) | OAuth2, Session, API Key | Stateless, idéal pour API REST, adapté au déploiement cloud, moderne |
| **Stockage métier** | PostgreSQL 16 | MySQL, MongoDB, SQLite | Performance, ACID, extensions JSON, intégrité référentielle (voir section 3 pour le statut actuel du MCD) |
| **Language frontend** | TypeScript + Angular | JavaScript/React, Vue | Typage fort, gestion d'état améliorée, entreprise, documentation riche |
| **Migrations DB** | Flyway | Liquibase, Hibernate | Simplicité, SQL pur, versioning clair |
| **Déploiement** | Docker Compose | Kubernetes (futur), local | Reproductibilité, conteneurisation, dev/prod alignés |
| **Stockage fichiers** | Volume Docker local | S3, Azure Blob, NFS | MVP pragmatique, débogage facile, upgrade vers S3 possible |
| **Tests frontend** | Karma + Jasmine + Playwright | Cypress, Jest, Mocha | Couverture unitaire + E2E, reporting avancé |
| **Build frontend** | Angular CLI | Webpack direct, Vite | Convention over configuration, HMR intégré |
| **Version Java** | Java 21 | Java 17, Java 11 | LTS actuelle, performance, features récentes |
| **Gestion dépendances** | Maven | Gradle, Ivy | Stabilité, plugin ecosystème, standard entreprise |

### Justifications détaillées

#### **Spring Boot**
Spring Boot est adapté car :
- Réduit la configuration boilerplate
- Injection de dépendances native
- Sécurité intégrée (Spring Security)
- Validation et gestion d'erreurs robustes
- Tests d'intégration faciles avec TestRestTemplate
- Permet une séparation propre (auth-core / user-backend-app)

#### **JWT**
Le choix du JWT est pertinent car :
- Authentification **stateless** (pas de sessions serveur)
- Scalabilité horizontale simplifiée
- Cohérent avec API REST moderne
- Token contient claims signé cryptographiquement
- Expiration configurable par utilisateur/application

#### **PostgreSQL**
PostgreSQL est choisi pour :
- **ACID strict** : garantie d'intégrité des données
- **Contraintes relationnelles** : garantir un MCD cohérent
- **Performance** : index, query planner optimisé
- **Extensibilité** : extensions JSON, full-text search
- **Open source** : communauté active, coût zéro

#### **Angular + TypeScript**
- **Typage fort** : détection d'erreurs à la compilation
- **Framework complet** : routing, HttpClient, forms, animations
- **Écosystème** : RxJS, Material Design
- **Entreprise-ready** : documentation abondante, support LTS

#### **Docker**
- Reproductibilité locale ↔ production
- Isolation des services
- Facilite onboarding équipe
- Prépare migration vers Kubernetes

---

## 3. Modèle de données

### ⚠️ Portée : Modèle documentaire cible

La section suivante décrit le **modèle de données cible** pour une persistance relationnelle propre. C'est la structure recommandée mais **pas l'implémentation actuellement livrée** du prototype.

**Status actuel du prototype** : Les métadonnées de fichiers sont stockées localement en fichiers `.properties` (voir `datashare-backend/docs/data-model.md` pour la distinction détaillée).

### MCD (Modèle Conceptuel de Données)

```
┌──────────────┐         ┌─────────────────┐         ┌──────────────┐
│    USER      │         │   FILE_ASSET    │         │  SHARE_LINK  │
├──────────────┤         ├─────────────────┤         ├──────────────┤
│ id (PK)      │◄────────│ id (PK)         │◄────────│ id (PK)      │
│ login        │ owns    │ owner_id (FK)   │ shared  │ file_id (FK) │
│ password_hash│         │ original_name   │ by      │ token        │
│ created_at   │         │ storage_path    │         │ expires_at   │
│              │         │ size_bytes      │         │ created_at   │
│              │         │ content_type    │         │              │
│              │         │ created_at      │         │              │
└──────────────┘         └─────────────────┘         └──────────────┘
```

### Tables relationnelles

#### **users**
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    login VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### **file_assets**
```sql
CREATE TABLE file_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    original_name VARCHAR(255) NOT NULL,
    storage_path VARCHAR(1024) NOT NULL,
    size_bytes BIGINT NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_file_assets_owner_id ON file_assets(owner_id);
```

#### **share_links**
```sql
CREATE TABLE share_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL REFERENCES file_assets(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_share_links_file_id ON share_links(file_id);
CREATE INDEX idx_share_links_token ON share_links(token);
```

### Règles de gestion

| Règle 	| Description 																	|
|-----------|-------------------------------------------------------------------------------|
| **R1** 	| Un utilisateur peut posséder plusieurs fichiers 								|
| **R2** 	| Un fichier appartient à un seul utilisateur 									|
| **R3** 	| Un fichier peut avoir plusieurs liens de partage 								|
| **R4** 	| La suppression d'un utilisateur supprime ses fichiers et leurs liens 			|
| **R5** 	| La suppression d'un fichier invalide/supprime ses liens de partage 			|
| **R6** 	| Un lien de partage a une date d'expiration (peut être nul pour "permanent") 	|

### Migrations Flyway

Fichiers versionnés dans `datashare-backend/src/main/resources/db/migration/` :
- `V1__init_schema.sql` : création des tables
- `V2__add_indexes.sql` : optimisation requêtes

---

## 4. Documentation d'API

### Spécification OpenAPI

La spécification complète est disponible dans : **`datashare-backend/docs/openapi.yaml`**

Pour visualiser interactivement : utiliser **Swagger UI** ou **Redoc** en pointant sur le fichier YAML.

### Endpoints résumés

#### **Authentification**

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| `POST` | `/api/register` | ❌ | Crée un compte utilisateur |
| `POST` | `/api/login` | ❌ | Authentifie et retourne JWT |
| `GET` | `/api/me` | ✅ | Retourne l'utilisateur courant |

**Exemples cURL** :

```bash
# Inscription
curl -X POST http://localhost:8080/api/register \
  -H "Content-Type: application/json" \
  -d '{"login":"alice@example.com","password":"SecurePass123!"}'

# Connexion
curl -X POST http://localhost:8080/api/login \
  -H "Content-Type: application/json" \
  -d '{"login":"alice@example.com","password":"SecurePass123!"}'

# Réponse:
# {"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...","expiresIn":3600}

# Profil utilisateur (avec token)
curl -X GET http://localhost:8080/api/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### **Gestion des fichiers**

| Méthode 	| Endpoint 							| Auth 	| Description 							|
|-----------|-----------------------------------|-------|---------------------------------------|
| `GET` 	| `/api/files` 						| ✅ 	| Liste les fichiers de l'utilisateur 	|
| `POST` 	| `/api/files` 						| ✅	| Upload un fichier 					|
| `GET` 	| `/api/files/{storedFileName}` 	| ✅ 	| Télécharge un fichier personnel 		|
| `DELETE` 	| `/api/files/{storedFileName}` 	| ✅ 	| Supprime un fichier 					|

#### **Partage de fichiers**

| Méthode 	| Endpoint 								| Auth 	| Description 					|
|-----------|---------------------------------------|-------|-------------------------------|
| `POST` 	| `/api/files/{storedFileName}/shares` 	| ✅ 	| Crée un lien de partage 		|
| `GET` 	| `/api/files/shared/{token}` 			| ❌ 	| Télécharge via lien public 	|

**Exemple partage** :

```bash
# Créer un lien de partage (expire dans 7 jours)
curl -X POST http://localhost:8080/api/files/document.pdf/shares \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"expiresIn": 604800}'

# Réponse:
# {"shareUrl":"http://localhost:8080/api/files/shared/abc123def456...","expiresAt":"2026-04-22T15:30:00Z"}

# Télécharger via lien public
curl http://localhost:8080/api/files/shared/abc123def456... -o document.pdf
```

### Codes de réponse HTTP

| Code 	| Signification 										|
|-------|-------------------------------------------------------|
| `200` | OK - Requête réussie 									|
| `204` | No Content - Création/suppression réussie 			|
| `400` | Bad Request - Requête invalide 						|
| `401` | Unauthorized - Token manquant ou invalide 			|
| `403` | Forbidden - Accès refusé (fichier non propriétaire) 	|
| `404` | Not Found - Ressource inexistante 					|
| `409` | Conflict - Login déjà utilisé 						|
| `413` | Payload Too Large - Fichier trop volumineux 			|
| `415` | Unsupported Media Type - Type MIME non autorisé 		|
| `507` | Insufficient Storage - Quota dépassé 					|

---

## 5. Sécurité et gestion des accès

*Voir document complet : `datashare-backend/SECURITY.md`*

### Authentification

- **Mécanisme** : JWT (JSON Web Token) signé avec HS256
- **Secret** : stocké dans variable d'environnement `JWT_SECRET`
- **Expiration** : configurable via `JWT_EXPIRATION_MILLIS` (défaut : 3600s = 1h)
- **Claims** : `sub` (login), `iat` (émission), `exp` (expiration)

### Contrôle d'accès

| Ressource 					| Condition d'accès 					|
|-------------------------------|---------------------------------------|
| `/api/register` 				| Public (pas d'auth) 					|
| `/api/login` 					| Public (pas d'auth) 					|
| `/api/me` 					| Token JWT valide requis 				|
| `/api/files` 					| Token JWT valide requis 				|
| `/api/files/{id}` 			| Token JWT + propriétaire du fichier 	|
| `/api/files/shared/{token}` 	| Public (lien de partage valide requis)|

### Mesures de sécurité en place

#### **Chiffrement**
- ✅ Mots de passe : hashés avec BCrypt (salage automatique)
- ✅ JWT : signé cryptographiquement (HS256)
- ✅ Transport : HTTPS recommandé en production

#### **Validation**
- ✅ Validation des entrées (email, taille fichier, etc.)
- ✅ Vérification du type MIME avant upload
- ✅ Limite de taille fichier (configurable)
- ✅ Limite de quota utilisateur

#### **Session**
- ✅ Politique `STATELESS` : pas de session serveur (scalable)
- ✅ Filtre JWT appliqué avant les traitements
- ✅ CORS configuré pour frontend unique (dev/prod)

### Gestion des secrets

**Variables d'environnement requises** :

```bash
JWT_SECRET=votre-secret-très-long-et-aléatoire
JWT_EXPIRATION_MILLIS=3600000
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DATABASE=backend_platform
POSTGRES_USER=backend
POSTGRES_PASSWORD=backend_password
```

**Bonnes pratiques** :
- ❌ Ne JAMAIS commiter les secrets en clair
- ✅ Utiliser `.env` localement (exclu de Git)
- ✅ Secrets Manager (Vault, AWS Secrets) en production
- ✅ Rotation régulière des secrets sensibles

### Résultats du scan CVE

**Date du scan** : 2026-03-30  
**CVE trouvées** : 0  
**Niveau de risque** : ⭐ Faible  

Dépendances directes scannées :
- org.springframework.boot:spring-boot-starter-web@3.5.5
- org.springframework.boot:spring-boot-starter-security@3.5.5
- org.postgresql:postgresql@42.x
- io.jsonwebtoken:jjwt-api@0.12.6
- [et autres - voir SECURITY.md pour liste complète]

**Scan CI automatique** : `.github/workflows/ci-maven.yml` → job `cve-scan`

### Limites et risques résiduels

| Risque 					| Description 						| Mitigation					|
|---------------------------|-----------------------------------|-------------------------------|
| Pas de rotation de token 	| Token émis n'a pas de revocation 	| Implémenter blacklist en cache|
| Pas d'anti-brute-force 	| Login vulnérable aux attaques 	| Ajouter throttling/captcha 	|
| Secret en environnement 	| Exposé dans logs/monitoring 		| Vault ou AWS Secrets Manager 	|
| Pas de 2FA 				| Authentification simple 			| Ajouter TOTP ou U2F 			|
| CORS permissif possible 	| Configuration à vérifier 			| Restreindre à domaines connus |

### Plan de remédiation court terme

1. **[URGENT]** Scan CVE continu en CI (avec blocage High/Critical)
2. **[URGENT]** Vérifier CORS en production (localhost → domaine cible)
3. **[MOYEN]** Ajouter throttling sur `/api/login`
4. **[MOYEN]** Externaliser secrets complets (Vault)
5. **[BONUS]** Implémenter 2FA

---

## 6. Qualité, tests et maintenance

*Voir documents complets : `TESTING.md`, `PERF.md`, `MAINTENANCE.md`*

### Plan de tests

#### **Tests unitaires**

**Backend** (`auth-core/src/test/java/`):
- `JwtServiceTest` : génération/validation tokens
- `AuthGuardTest` : autorisation des endpoints

**Frontend** (`datashare-frontend/webapp/src/app/`):
- `AuthService.spec.ts` : login/register/getMe
- `FileService.spec.ts` : upload/download/delete
- `JwtInterceptor.spec.ts` : ajout Authorization header
- `AuthGuard.spec.ts` : redirection login

**Commande** :
```bash
# Backend
mvn -f pom.xml test

# Frontend
npm run test:unit
```

#### **Tests d'intégration**

**Backend** (`user-backend-app/src/test/java/`):
- `AuthFlowIntegrationTest` : flux register→login→protected
- `FileUploadIntegrationTest` : upload/download/delete/share

**Frontend** (`datashare-frontend/webapp/src/tests/`):
- `login.integration.spec.ts` : appels API + routing
- `register.integration.spec.ts` : validation + création compte
- `upload.integration.spec.ts` : selection fichier + POST

**Commande** :
```bash
# Backend
mvn -f user-backend-app/pom.xml test

# Frontend
npm run test:integration
```

#### **Tests E2E (End-to-End)**

**Outil** : Playwright (TypeScript)  
**Scénarios** :
- Smoke test : landing → login → register → upload → my-space → logout
- Navigation complète entre pages
- Gestion des erreurs (identifiants invalides, fichier trop gros)

**Commande** :
```bash
npx playwright install chromium
npm run test:e2e
```

**Rapports** : `datashare-frontend/webapp/playwright-report/`

#### **Pipeline local complète**

```bash
npm run test:ci
```

Exécute : unitaires → intégration → fonctionnels → E2E

### Résultats actuels connus

| Suite 				| Statut 	| Cas couverts 							|
|-----------------------|-----------|---------------------------------------|
| JWT unitaires 		| ✅ PASS	| Génération, validation, claims 		|
| Auth flow 			| ✅ PASS	| Login, profil, token invalide 		|
| Upload/Download 		| ✅ PASS 	| Succès, validation fichier, quotas 	|
| E2E Playwright 		| ✅ PASS 	| Navigation smoke test + landing 		|
| Frontend unitaires 	| ✅ PASS 	| Services, intercepteur, guard 		|

### Couverture

**État actuel** : Mesure de couverture non encore activée en CI

**Objectif mission** : Atteindre **70%+** de couverture combinée (backend + frontend)

**Outil recommandé** : JaCoCo (backend) + Istanbul (frontend)

**Commande cible** (après activation) :
```bash
mvn -f pom.xml clean verify  # Génère rapport JaCoCo
```

### Performance

*Voir document complet : `datashare-backend/PERF.md`*

#### **Endpoint critique**

Actuellement : `POST /api/login`

**Budget cible** :
- **p95 < 300 ms** (local)
- **Taux d'erreur < 1%**
- **Débit : 50+ req/s** avec 20 VU

#### **Résultats actuels**

[À remplir après exécution test k6]

#### **Outil de mesure**

```bash
k6 run perf/load-test-login.js --vus 20 --duration 1m
```

Script exemple disponible dans `datashare-backend/PERF.md`

### Maintenance

*Voir document complet : `datashare-backend/MAINTENANCE.md`*

#### **Routine recommandée**

**Hebdomadaire** :
- Vérification des dépendances (nouvelles versions/CVE)
- Revue des alertes de sécurité
- Tests sur `develop`

**Mensuelle** :
- Mise à jour dépendances non-critiques
- Revue deprecations
- Réévaluation des risques

#### **Procédure de mise à jour des dépendances**

```bash
# 1. Créer une branche
git checkout -b chore/deps-2026-04

# 2. Mettre à jour versions
mvn -f pom.xml versions:update-properties versions:display-dependency-updates

# 3. Tester
mvn -f pom.xml clean test

# 4. Commit + PR
git add pom.xml*
git commit -m "chore(deps): update maven dependencies"
```

#### **Gestion des incidents**

1. Reproduire avec logs
2. Isoler cause (quelle entité/endpoint)
3. Corriger branche `fix/*`
4. Rejeux tests unitaires + intégration
5. Merger sur `main` avec rollback plan

#### **Critères de sortie par release**

- ✅ Tous les tests passent (`mvn test`, `npm test`)
- ✅ Aucun incident bloquant ouvert
- ✅ Documentation d'exploitation synchronisée
- ✅ Scan CVE exécuté et ok

---

## 7. Processus d'installation et d'exécution

### Prérequis

#### **Environnement local**

| Composant 			| Version minimale 					|
|-----------------------|-----------------------------------|
| **Java** 				| 21 (JDK) 							|
| **Maven** 			| 3.9+ 								|
| **Node.js** 			| 18+ (LTS recommandé) 				|
| **npm** 				| 9+ 								|
| **Docker** 			| 24+ (optionnel mais recommandé) 	|
| **Docker Compose** 	| 2.20+ 							|
| **PostgreSQL** 		| 16 (via Docker) 					|

#### **Prérequis détaillés**

```bash
# Vérifier Java
java -version
# Résultat attendu : java 21.x.x

# Vérifier Maven
mvn -version
# Résultat attendu : Maven 3.9.x

# Vérifier Node.js
node -version && npm -version
# Résultat attendu : v18.x.x, 9.x.x

# Vérifier Docker (optionnel)
docker --version && docker-compose --version
# Résultat attendu : Docker 24.x, Compose 2.20+
```

### Installation

#### **Étape 1 : Cloner le repository**

```bash
git clone https://github.com/YADN2K23/OC_P3_DataShare.git
cd DataShare
```

#### **Étape 2 : Installer dépendances backend**

```bash
cd datashare-backend
mvn clean install
```

Cela va :
- Télécharger les dépendances Maven
- Compiler les modules `auth-core` et `user-backend-app`
- Exécuter les tests

#### **Étape 3 : Installer dépendances frontend**

```bash
cd ../datashare-frontend/webapp
npm install
npx playwright install chromium  # Pour tests E2E
```

### Exécution

#### **Option 1 : Complète avec Docker Compose (RECOMMANDÉE)**

```bash
# Depuis racine DataShare
docker compose -f datashare-backend/compose.yaml up --build
```

Cela lance :
- ✅ PostgreSQL 16 sur `localhost:5432`
- ✅ Backend Spring Boot sur `http://localhost:8080`
- ✅ Volume de stockage fichiers : `/data/uploads`

Dans un **autre terminal** :

```bash
cd datashare-frontend/webapp
npm start
```

Puis ouvrir : **`http://localhost:4200`**

#### **Option 2 : Backend local sans Docker (avancé)**

Prérequis : PostgreSQL 16 en local

```bash
# 1. Démarrer PostgreSQL
psql -U postgres -d postgres -c "CREATE DATABASE backend_platform OWNER backend;"

# 2. Configurer variables d'environnement
export JWT_SECRET="my-super-secret-key-at-least-32-chars"
export POSTGRES_HOST=localhost
export POSTGRES_PORT=5432
export POSTGRES_DATABASE=backend_platform
export POSTGRES_USER=backend
export POSTGRES_PASSWORD=backend_password

# 3. Lancer backend
cd datashare-backend
mvn -f user-backend-app/pom.xml spring-boot:run

# 4. Lancer frontend (autre terminal)
cd datashare-frontend/webapp
npm start
```

#### **Option 3 : Tout local en dev (plus simple)**

```bash
# Terminal 1 : Backend (avec base H2 en mémoire)
cd datashare-backend
mvn -f user-backend-app/pom.xml spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=dev"

# Terminal 2 : Frontend
cd datashare-frontend/webapp
npm start
```

### Configuration

#### **Environnements**

**Frontend** (`datashare-frontend/webapp/src/environments/`) :

```typescript
// environment.ts (DEV)
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
  jwtKey: 'token' // clé localStorage
};

// environment.prod.ts (PROD)
export const environment = {
  production: true,
  apiUrl: 'https://api.datashare.fr/api',
  jwtKey: 'token'
};
```

**Backend** (`datashare-backend/user-backend-app/src/main/resources/application.yml`) :

```yaml
# Dev
spring.datasource.url: jdbc:postgresql://localhost:5432/backend_platform
spring.datasource.username: backend
spring.datasource.password: backend_password
jwt.secret: dev-secret-key
jwt.expiration-millis: 3600000

# Prod (via env vars)
spring.datasource.url: jdbc:postgresql://${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DATABASE}
spring.datasource.username: ${POSTGRES_USER}
spring.datasource.password: ${POSTGRES_PASSWORD}
jwt.secret: ${JWT_SECRET}
jwt.expiration-millis: ${JWT_EXPIRATION_MILLIS:3600000}
```

#### **Variables d'environnement essentielles**

```bash
# Backend
JWT_SECRET=super-secret-key-at-least-32-characters-long
JWT_EXPIRATION_MILLIS=3600000  # 1 heure
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DATABASE=backend_platform
POSTGRES_USER=backend
POSTGRES_PASSWORD=backend_password

# Frontend (optionnel, par défaut localhost:8080)
API_URL=http://localhost:8080/api
```

### Tests

#### **Backend**

```bash
cd datashare-backend

# Tous les tests
mvn clean test

# Tests module spécifique
mvn -f auth-core/pom.xml test
mvn -f user-backend-app/pom.xml test

# Avec couverture (après activation JaCoCo)
mvn clean verify
```

#### **Frontend**

```bash
cd datashare-frontend/webapp

# Unitaires
npm run test:unit

# Intégration
npm run test:integration

# Fonctionnels
npm run test:functional

# E2E
npm run test:e2e

# Pipeline complète (CI)
npm run test:ci
```

### Builds

#### **Backend**

```bash
cd datashare-backend

# JAR executable
mvn clean package

# Fichier généré : user-backend-app/target/user-backend-app-1.0.0-SNAPSHOT.jar
java -jar user-backend-app/target/user-backend-app-1.0.0-SNAPSHOT.jar
```

#### **Frontend**

```bash
cd datashare-frontend/webapp

# Production build
npm run build

# Output : dist/webapp/
# Prêt à être servi par Nginx
```

#### **Docker (optionnel)**

```bash
# Frontend Nginx
cd datashare-frontend/webapp
npm run docker:build
npm run docker:run

# Backend (inclus dans compose.yaml)
docker compose -f datashare-backend/compose.yaml up --build
```

### Troubleshooting

| Problème | Cause | Solution |
|----------|-------|----------|
| Port 8080 occupé | Autre service en cours | `lsof -i :8080` + `kill -9 <PID>` |
| Port 4200 occupé | Autre app Angular | `lsof -i :4200` + `kill -9 <PID>` |
| PostgreSQL connection refused | Service non démarré | `docker compose up -d` ou `sudo service postgresql start` |
| CORS error | Backend CORS mal configuré | Vérifier `SecurityConfig.java` |
| Tests Playwright fail | Chromium pas installé | `npx playwright install chromium` |
| Maven "Cannot find module" | Pom.xml mal configuré | `mvn clean install -U` |

---

## 8. Utilisation de l'IA dans le développement

### Posture globale

**Modèle adopté** : IA comme **Junior Developer** avec **Pair Programming**

L'IA (GitHub Copilot) a été assignée à des tâches précises sous supervision :
- Génération de code boilerplate
- Implémentation de fonctionnalités standards
- Génération de tests
- Rédaction de documentation
- Correction d'erreurs sur indication humaine

### Tâches confiées à l'IA

#### **Backend (Spring Boot)**

| Tâche | Description | Résultat |
|-------|-------------|----------|
| **Architecture modulaire** | Séparation auth-core / user-backend-app | ✅ Code lisible, réutilisable |
| **JwtService** | Génération + validation tokens JWT | ✅ Implémentation robuste |
| **Entities JPA** | UserEntity, FileAssetEntity, ShareLinkEntity | ✅ Relations correctes, getters/setters |
| **Repositories** | JpaRepository pour accès données | ✅ Requêtes JPQL générées |
| **SecurityConfig** | Configuration JWT + CORS + endpoints | ✅ Stateless, bien sécurisé |
| **Controllers** | REST endpoints (login, upload, etc) | ✅ Validation + codes HTTP appropriés |
| **Tests unitaires** | JwtServiceTest, AuthFlowIntegrationTest | ✅ Couverture cas nominaux + edges |
| **Migrations Flyway** | Schéma SQL + indexes | ✅ Optimisé, contraintes FK |

#### **Frontend (Angular)**

| Tâche | Description | Résultat |
|-------|-------------|----------|
| **Architecture** | Services + Guards + Interceptors | ✅ Pattern Angular standard |
| **AuthService** | Login/register/getMe/logout | ✅ Appels API corrects |
| **FileService** | Upload/download/delete/share | ✅ FormData multipart, observables |
| **JwtInterceptor** | Ajout Authorization header | ✅ Transparent, gère erreurs 401 |
| **AuthGuard** | Protection des routes | ✅ Redirection login correct |
| **Pages/Components** | Landing, Login, Register, Upload, MySpace | ✅ Formulaires réactifs, validation |
| **Tests Karma+Jasmine** | Unitaires services + components | ✅ Mocks HttpClient, bonne couverture |
| **Tests Playwright** | E2E smoke test | ✅ Navigation complète validée |
| **Styling SCSS** | Responsive design basic | ✅ Mobile-first approach |

#### **Documentation**

| Tâche | Description | Résultat |
|-------|-------------|----------|
| **Architecture** | Diagrammes texte + description modules | ✅ Clair, complet |
| **Choix technologiques** | Justification 1-2 pages par choix | ✅ Argumenté vs alternatives |
| **MCD + SQL** | Entités, relations, schéma | ✅ Mermaid diagram + DDL |
| **API OpenAPI** | Contrat REST complet | ✅ YAML valide, tous endpoints |
| **TESTING.md** | Cas de test, critères acceptation | ✅ Tableau 18 cas couverts |
| **SECURITY.md** | Contrôles, mesures, scan CVE | ✅ Résultats + plan remédiation |
| **PERF.md** | Budget, métriques, script k6 | ✅ Template fourni |
| **MAINTENANCE.md** | Routine, incidents, risques | ✅ Procédures détaillées |
| **README.md** | Setup local, commandes | ✅ Multi-options (Docker/local) |

### Supervision et corrections apportées

#### **Revues de code**

| Domaine | Corrections apportées |
|---------|---------------------|
| **Sécurité** | Validation des entrées renforcée, CORS restreint, secrets externalisés |
| **Performance** | Ajout indexes DB, lazy loading images, caching JWT |
| **Lisibilité** | Renommage variables, commentaires métier, logs structurés |
| **Tests** | Ajout cas d'erreur, mocks corrigés, assertions robustes |
| **Patterns** | Injection dépendances corrigée, observables RxJS optimisés |
| **Documentation** | Justifications détaillées, schémas complets, examples concrets |

#### **Ajustements de sécurité**

- ✅ Ajout BCrypt pour hashage mots de passe (IA proposait plain text)
- ✅ Vérification CORS restrictif (pas `*` en prod)
- ✅ Exposition des secrets minimisée (env vars vs hardcoding)
- ✅ Validation MIME type fichiers upload
- ✅ Limite de taille fichier configurée
- ✅ Protection contre injections SQL (JPA paramétrisées)

#### **Améliorations de performance**

- ✅ Indexes ajoutés sur FK (owner_id, file_id)
- ✅ Pagination pour listing fichiers (futur)
- ✅ Caching localStorage JWT (frontend)
- ✅ Lazy loading images fichiers (frontend)
- ✅ Query optimization JPQL (SELECT what you need)

#### **Corrections d'erreurs**

| Erreur initiale | Cause | Correction |
|-----------------|-------|-----------|
| CORS 403 | Origine non autorisée | Ajout `http://localhost:4200` en SecurityConfig |
| 401 à chaque requête | Token non stocké | Ajout localStorage.getItem dans AuthService |
| Upload fails | Pas de FormData | Conversion multipart/form-data correcte |
| Tests Playwright timeout | Selector invalide | Ajout `data-testid` aux éléments HTML |
| Build Angular fail | Tsconfig.json manquant | Copie config de boilerplate Angular 18 
