# 🔙 Backend DataShare

Backend Spring Boot 3.5.5 pour la plateforme DataShare - Gestion d'authentification JWT, fichiers sécurisés et partage public.

## 📋 Structure du projet

```
backend/
├── auth-core/                          # Module JWT (library)
│   ├── src/main/java/com/auth/
│   │   └── jwt/                        # JwtService, JwtTokenProvider
│   └── pom.xml
│
├── user-backend-app/                   # Module API Spring Boot
│   ├── src/main/java/com/datashare/
│   │   ├── api/                        # Controllers REST
│   │   ├── auth/                       # Filters JWT
│   │   ├── service/                    # Business logic
│   │   ├── repository/                 # JPA Repositories
│   │   └── Application.java            # Spring Boot entry point
│   │
│   ├── src/main/resources/
│   │   ├── application.yml             # Config Spring
│   │   └── db/migration/               # Flyway migrations (V1-V5)
│   │
│   ├── src/test/java/                  # Tests JUnit 5 + Mockito
│   └── pom.xml
│
├── pom.xml                             # Parent POM (monorepo)
├── compose.yaml                        # Docker Compose (développement)
├── Dockerfile                          # Image production
├── .env.example                        # Secrets (template)
├── ../MAINTENANCE.md                   # Exploitation & maintenance
├── ../TESTING.md                       # Plan de tests
├── ../PERF.md                          # Performance & benchmarks
├── SECURITY.md                         # Politique sécurité
└── README.md                           # Ce fichier

```

## ⚡ Quick Start

### Prérequis

- **Java 21+**
- **Maven 3.8+**
- **Docker + Docker Compose**
- **PostgreSQL 16** (via Docker)
- **k6** (optionnel, pour tests de charge)

### 1️⃣ Lancer le stack Docker

```powershell
cd backend
docker compose up --build
```

Le conteneur démarre:
- **PostgreSQL 16** sur `localhost:5432` (user: `datashare`, password: voir `.env`)
- **Spring Boot** sur `http://localhost:8080` (Swagger UI: `http://localhost:8080/swagger-ui.html`)

### 2️⃣ Vérifier la connectivité

```powershell
# Swagger UI (documentation interactive)
Start-Process "http://localhost:8080/swagger-ui.html"

# Test simple
Invoke-RestMethod -Uri "http://localhost:8080/api/health" -Method Get
```

### 3️⃣ Créer un compte test

```powershell
$body = '{"login":"test@datashare.local","password":"TestPass123!"}'

$response = Invoke-RestMethod -Uri 'http://localhost:8080/api/register' `
  -Method Post -ContentType 'application/json' -Body $body

Write-Host "Inscription: OK"
```

### 4️⃣ Se connecter

```powershell
$response = Invoke-RestMethod -Uri 'http://localhost:8080/api/login' `
  -Method Post -ContentType 'application/json' -Body $body

$token = $response.token
Write-Host "Token: $token"
```

### 5️⃣ Accéder à l'utilisateur

```powershell
$headers = @{ "Authorization" = "Bearer $token" }
$me = Invoke-RestMethod -Uri 'http://localhost:8080/api/me' `
  -Method Get -Headers $headers

Write-Host $me
```

## 🏗️ Architecture

### Couches (Clean Architecture)

```
┌─────────────────────────────────────┐
│         Controllers REST            │ ← HTTP endpoints
├─────────────────────────────────────┤
│    Services (Business Logic)        │ ← Métier, validations
├─────────────────────────────────────┤
│        Repositories (JPA)           │ ← Data Access
├─────────────────────────────────────┤
│       PostgreSQL 16 + Flyway        │ ← Persistence
└─────────────────────────────────────┘
```

### Modules Maven

| Module 				| Rôle 								| Tests 			|
|-----------------------|-----------------------------------|-------------------|
| `auth-core` 			| JWT (génération, validation) 		| 8 unitaires 		|
| `user-backend-app` 	| API + Spring Boot 				| 36 intégration 	|
| **Total** 			| 									| **44 tests** 		|

### Sécurité

- **JWT HS256** (stateless, 24h expiration)
- **BCrypt** password hashing
- **Rate Limiting** (5 tentatives login)
- **MIME type + signature** file validation
- **CORS** contrôlé

## 📡 API REST (12 endpoints)

### Authentification

```
POST   /api/register          → Créer compte
POST   /api/login             → Se connecter (retourne JWT)
POST   /api/refresh           → Renouveler le JWT via le cookie `refresh_token`
POST   /api/logout            → Révoquer le refresh token et effacer le cookie
GET    /api/me                → Récupérer profil utilisateur
```

### Fichiers

```
GET    /api/files?page=0&size=20          → Lister fichiers utilisateur
POST   /api/files                         → Upload fichier
GET    /api/files/{storedFileName}        → Télécharger fichier personnel
DELETE /api/files/{storedFileName}        → Supprimer fichier
```

### Partage Public

```
GET    /api/files/shared/{shareToken}     → Télécharger via lien public
POST   /api/files/{storedFileName}/share  → Créer lien de partage
```

### Détails complets

→ Voir `docs/SWAGGER_GUIDE.md`

### Flux d'authentification

- `POST /api/login` renvoie le JWT d'accès dans le corps JSON et pose aussi un cookie `refresh_token` HttpOnly.
- `POST /api/refresh` renouvelle le JWT à partir de ce cookie.
- `POST /api/logout` révoque le refresh token et vide le cookie.

## 🧪 Tests

### Lancer tous les tests

```powershell
cd backend
mvn clean test
```

**Résultat attendu:** ✅ 44/44 PASSED (100%), JaCoCo 70%+

### Par module

```powershell
# auth-core (8 tests unitaires JWT)
mvn -f auth-core/pom.xml test

# user-backend-app (36 tests intégration)
mvn -f user-backend-app/pom.xml test
```

### Couverture JaCoCo

```powershell
mvn clean verify
# Rapports HTML: auth-core/target/site/jacoco/index.html
```

## 📊 Performance

### Benchmarks (2026-05-08) ✅

**Test LOGIN:** 20 VUS, 1 minute
- p95: 104.32ms < 300ms ✅
- p99: 138.69ms < 600ms ✅
- Error: 0% ✅

**Test FILES:** 10 VUS, 1 minute
- p95: 75.06ms < 500ms ✅
- p99: 82.88ms < 1000ms ✅
- Error: 0% ✅

### Reproduire les tests

```powershell
cd backend

# Test LOGIN
$env:VUS="20"; $env:DURATION="1m"
k6 run ..\perf\login_k6.js

# Test FILES
$env:VUS="10"; $env:DURATION="1m"  
k6 run ..\perf\files_k6.js
```

→ Voir `../PERF.md` pour détails complets

## 🔐 Sécurité

| Aspect 		| Implémentation 								|
|---------------|-----------------------------------------------|
| **JWT** 		| HS256, 24h TTL, rate limiting 5 tentatives 	|
| **Password** 	| BCrypt + salt 								|
| **Files** 	| Type MIME + signature validation 				|
| **Access** 	| Bearer token obligatoire (401 si absent) 		|
| **CORS** 		| Origins whitlistés 							|
| **Secrets** 	| `.env.example` + gestionnaire secrets en prod |

→ Voir `SECURITY.md` pour politique complète

## 🛠️ Configuration

### Variables d'environnement (`.env`)

```env
POSTGRES_USER=datashare              # User PostgreSQL
POSTGRES_PASSWORD=MyPassword123      # Password PostgreSQL (CHANGER EN PROD)
JWT_SECRET=mon-secret-jwt-de-32... # Secret JWT min 32 chars (CHANGER)
```

### Application Properties

Fichier: `user-backend-app/src/main/resources/application.yml`

```yaml
server:
  port: 8080

spring:
  datasource:
    url: jdbc:postgresql://postgres:5432/datashare
    username: ${POSTGRES_USER}
    password: ${POSTGRES_PASSWORD}
  jpa:
    hibernate:
      ddl-auto: validate  # Flyway gère migrations
  flyway:
    locations: classpath:db/migration

app:
  jwt:
    secret: ${JWT_SECRET}
    expiration: 86400000  # 24h ms
```

## 📚 Documentation

- **Swagger UI:** `http://localhost:8080/swagger-ui.html` (interactive)
- **Swagger YAML:** `http://localhost:8080/v3/api-docs`
- **Guide API:** `docs/SWAGGER_GUIDE.md`
- **Architecture:** root `DOCUMENTATION_TECHNIQUE.md`
- **Maintenance:** `../MAINTENANCE.md`
- **Tests:** `../TESTING.md`
- **Performance:** `../PERF.md`
- **Sécurité:** `SECURITY.md`

## 🚀 Déploiement

### Docker Production

```powershell
# Build image
docker build -t datashare-backend:latest .

# Run
docker run -d --name datashare-backend \
  -e POSTGRES_USER=datashare \
  -e POSTGRES_PASSWORD=xxxx \
  -e JWT_SECRET=yyyy \
  -p 8080:8080 \
  datashare-backend:latest
```

### Docker Compose Multi-Env

```powershell
# Développement
docker compose up

# Staging
docker compose -f compose.staging.yml up

# Production (voir playbooks Ansible)
```

## 📋 Checklist avant livraison

- ✅ Tests: 44/44 PASSED
- ✅ JaCoCo: 70%+
- ✅ Migrations Flyway: V1-V5
- ✅ Performance: SLA validées
- ✅ Documentation à jour
- ✅ Pas de secrets dans Git
- ✅ `.env.example` commité
- ✅ Dockerfile optimisé
- ✅ CORS configuré
- ✅ Logs structurés

## 🆘 Troubleshooting

### Erreur: "Connection refused" PostgreSQL

```powershell
# Vérifier conteneur
docker ps

# Voir logs
docker compose logs postgres

# Redémarrer
docker compose down -v
docker compose up --build
```

### Erreur: "JWT_SECRET not set"

```powershell
# Créer .env depuis exemple
Copy-Item .env.example .env
# Éditer avec valeurs réelles
```

### Tests échouent (35/44)

```powershell
# Vérifier base test est clean
docker exec datashare-postgres psql -U datashare -d datashare \
  -c "SELECT COUNT(*) FROM users;"

# Relancer tests
mvn clean test -DskipTests=false
```

## 📞 Support

- **Code:** Stack Overflow, GitHub Issues
- **Docs:** `DOCUMENTATION_TECHNIQUE.md`
- **Maintenance:** Voir `../MAINTENANCE.md`
- **Tests:** Voir `../TESTING.md`

---

**Version:** 1.0.0  
**Date:** 2026-05-10  
**Status:** ✅ Production-Ready


