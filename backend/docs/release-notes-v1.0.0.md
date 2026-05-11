# Release Notes - v1.0.0

## Objectif
Stabiliser un socle backend Spring Boot propre, securise et testable, avec un domaine generique `user`.

## Changements majeurs
- Migration domaine: `etudiant` -> `user` (code, packages, tests, docs).
- Renommage du module applicatif: `user-backend-app`.
- Externalisation des secrets via variables d'environnement (`JWT_SECRET`, `JWT_EXPIRATION_MILLIS`, `APP_AUTH_DEMO_USER_LOGIN`, `APP_AUTH_DEMO_USER_PASSWORD`).
- Scan CVE en CI sur PR + nightly, avec seuil bloquant High/Critical.
- Renforcement des tests auth (JWT negatifs, cas negatifs `/api/login`, tests branches `JwtAuthenticationFilter`).

## Validation technique
Commande executee:

```powershell
mvn -B -ntp -f pom.xml clean verify
```

Resultat:
- Build monorepo: SUCCESS
- `auth-core`: tests OK
- `user-backend-app`: tests OK

## Couverture JaCoCo (global)
- INSTRUCTION: 94.63%
- BRANCH: 81.25%
- LINE: 94.44%

## Impact
Socle pret pour evolutions metier (upload/partage) avec un niveau de qualite et de lisibilite adapte a un rendu professionnel.

