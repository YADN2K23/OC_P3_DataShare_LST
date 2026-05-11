## Objectif
Finaliser un socle backend propre, generic et presentable pour le rendu, avec migration domaine `etudiant` -> `user`, securisation de la configuration et consolidation qualite/tests.

## Points livres

### 1) Refactor domaine et structure
- Migration des packages applicatifs vers `com.youssefdev.user`.
- Renommage de l'application principale en `UserBackendAppApplication`.
- Renommage du module Maven en `user-backend-app` (dossier + `artifactId` + references docs).

### 2) Securite
- Externalisation des secrets (`JWT_SECRET`, `JWT_EXPIRATION_MILLIS`, `APP_AUTH_DEMO_USER_LOGIN`, `APP_AUTH_DEMO_USER_PASSWORD`).
- Documentation securite mise a jour.
- Scan CVE CI ajoute sur PR + nightly, blocage sur High/Critical.

### 3) Tests et qualite
- Renforcement `auth-core` (`token invalide`, `utilisateur different`, `token expire`).
- Ajout de cas negatifs `/api/login` dans `user-backend-app`.
- Ajout de tests unitaires cibles pour `JwtAuthenticationFilter`.

## Validation technique
Commande executee:

```powershell
mvn -B -ntp -f pom.xml clean verify
```

Resultat:
- `auth-core`: tests OK
- `user-backend-app`: tests OK
- Build monorepo: SUCCESS

## Couverture JaCoCo (etat courant)
- INSTRUCTION (global): 94.63%
- BRANCH (global): 81.25%
- LINE (global): 94.44%

## Impact
Le socle est stable, teste, securise et pret pour extension des features metier (upload/partage).

