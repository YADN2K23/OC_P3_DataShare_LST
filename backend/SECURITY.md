# SECURITY

## Objectif

Documenter les controles de securite du prototype backend et les actions de suivi.

## Mesures en place

- Authentification stateless via JWT
- Endpoint public: `POST /api/login`
- Endpoint protege: `GET /api/me`
- Filtre JWT applique avant `UsernamePasswordAuthenticationFilter`
- Politique de session: `STATELESS`
- Authentification alimentee par une base PostgreSQL locale via Flyway
- Limitation anti-bruteforce en memoire sur `POST /api/login` (par IP + login)
- Journalisation d'audit securite pour les echecs login, blocages login, suppressions fichier et creations de lien de partage
- Verification des signatures de fichiers pour PDF, PNG et JPEG en complement du `Content-Type` declaratif
- Mot de passe optionnel de fichier stocke sous forme de hash BCrypt et verifie au telechargement proprietaire

## Controle d'acces

- Sans token valide, les endpoints proteges retournent `401`.
- Avec token valide, l'utilisateur peut acceder a ses ressources protegees.

## Configuration sensible

Fichier concerne: `user-backend-app/src/main/resources/application.yml`

- `jwt.secret`
- `jwt.expiration-millis`
- configuration PostgreSQL (`POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DATABASE`, `POSTGRES_USER`, `POSTGRES_PASSWORD`)

### Regles de hygiene

- Ne pas commiter de secret de production en clair.
- Utiliser des variables d'environnement pour les secrets hors environnement local.
- Conserver des secrets differents par environnement (dev/test/prod).
- Fournir les secrets Docker via `backend/.env` local non commite ou via le gestionnaire de secrets de l'environnement cible.

Variables d'environnement attendues:

- `JWT_SECRET` -> `jwt.secret`
- `JWT_EXPIRATION_MILLIS` -> `jwt.expiration-millis`
- `POSTGRES_HOST` -> hote PostgreSQL
- `POSTGRES_PORT` -> port PostgreSQL
- `POSTGRES_DATABASE` -> nom de base
- `POSTGRES_USER` -> utilisateur BDD
- `POSTGRES_PASSWORD` -> mot de passe BDD

## Methodologie de scan

### Dependances (CVE)

- Outil utilise: validation CVE sur dependances Maven.
- Date du scan: 2026-03-30.
- Surveillance continue: scan CI sur chaque Pull Request vers `main` + execution nightly.
- Politique de blocage: echec CI si CVSS >= 7 (High/Critical).
- Perimetre scanne (direct dependencies):
  - `org.springframework.boot:spring-boot-starter-web@3.5.5`
  - `org.springframework.boot:spring-boot-starter-data-jpa@3.5.5`
  - `org.springframework.boot:spring-boot-starter-security@3.5.5`
  - `org.springframework.boot:spring-boot-starter-test@3.5.5`
  - `org.flywaydb:flyway-core@11.x`
  - `org.flywaydb:flyway-database-postgresql@11.x`
  - `org.postgresql:postgresql@42.x`
  - `com.h2database:h2@2.x`
  - `io.jsonwebtoken:jjwt-api@0.12.6`
  - `io.jsonwebtoken:jjwt-impl@0.12.6`
  - `io.jsonwebtoken:jjwt-jackson@0.12.6`
  - `org.projectlombok:lombok@1.18.38`

### Secrets

- Verifications manuelles en cours dans le repo.
- Secret scanning automatise recommande en CI (GitHub Advanced Security ou equivalent).

## Strategie XSS / JWT

Le front conserve un access token JWT cote navigateur pour le MVP. La mitigation appliquee actuellement est:

- CSP stricte dans `datashare-frontend/webapp/nginx.conf`.
- Absence de scripts tiers et restriction `object-src 'none'`, `frame-ancestors 'none'`.
- Donnees utilisateur affichees via interpolation Angular, pas via injection HTML.
- Duree de vie courte du token configurable par `JWT_EXPIRATION_MILLIS`.
- Refresh token stocke cote navigateur en cookie `HttpOnly`, `Secure` si active par configuration, `SameSite=Lax`, `Path=/api`.
- Le JWT d'acces reste transmis dans le corps de reponse et le refresh token n'est pas expose au JavaScript.

Evolution recommandee pour production: renforcer encore la strategie de stockage de l'access token cote client (memoire uniquement) et evaluer `SameSite=Strict` selon les contraintes d'usage.

## Journalisation securite

Logger dedie: `security.audit`.

Evenements journalises:

- `login_failure`
- `login_rate_limited`
- `login_success`
- `logout`
- `file_delete`
- `share_link_created`

Les logs ne doivent jamais contenir de mot de passe, JWT ou token de partage complet.

## Resultats du scan

- CVE connues trouvees sur le perimetre ci-dessus: **0**.
- Niveau de risque immediat sur dependances directes: **faible**.

## Limites du resultat

- Le scan couvre les dependances directes; les transitives doivent etre surveillees en CI.
- Un scan ponctuel ne remplace pas une surveillance continue.

## Integration CI

- Workflow: `.github/workflows/ci-maven.yml`
- Job dedie: `cve-scan`
- Commande utilisee:

```powershell
mvn -B -ntp -f pom.xml org.owasp:dependency-check-maven:12.1.0:check -Dformat=HTML -Dformat=JSON -DfailBuildOnCVSS=7
```

- Rapports publies en artefact CI:
  - `dependency-check-report.html`
  - `dependency-check-report.json`

## Risques residuels identifies

- Prototype avec utilisateur de demonstration unique.
- Rotation JWT avancee non implementee: pas encore de `kid` ni de validation multi-cle.
- Rate limiting en memoire: suffisant pour demonstration locale, a deplacer cote ingress ou Redis en production multi-instance.
- Audit log texte non centralise: a exporter vers une pile de logs en production.

## Plan de remediation court terme (priorise)

1. Mettre en place `kid` + validation multi-cle pour permettre la rotation progressive du `JWT_SECRET`.
2. Remplacer le rate limiting en memoire par Bucket4j/Redis ou par un rate limiter ingress.
3. Faire evoluer la strategie JWT vers access token en memoire uniquement si le contexte produit le permet.
4. Activer un secret scanning automatique et definir une procedure de rotation des secrets.


