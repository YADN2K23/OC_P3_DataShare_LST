# user-backend-app

Application exemple du domaine user qui consomme `auth-core`.

## Endpoints

- `POST /api/register` (public)
- `POST /api/login` (public)
- `POST /api/refresh` (public, utilise le cookie `refresh_token` HttpOnly)
- `POST /api/logout` (public, revoque le cookie `refresh_token`)
- `GET /api/me` (protege, token JWT requis)
- `GET /api/files` (protege, liste des fichiers proprietaire)
- `GET /api/files/history` (protege, historique des actions fichiers)
- `POST /api/files` (protege, upload multipart, plafond 1 Go)
- `GET /api/files/{storedFileName}` (protege, telechargement d'un fichier)
- `DELETE /api/files/{storedFileName}` (protege, suppression d'un fichier)
- `POST /api/files/{storedFileName}/shares` (protege, cree un lien de partage)
- `GET /api/files/shared/{token}` (public, telechargement via lien partage)

Le flux d'authentification utilise un JWT d'accès renvoyé dans le corps de `POST /api/login` et un refresh token stocké en cookie `HttpOnly`.

## Lancer l'application

Variables d'environnement requises:

- `JWT_SECRET` (obligatoire)
- `JWT_EXPIRATION_MILLIS` (optionnel, defaut `86400000`)
- `POSTGRES_HOST` (optionnel, defaut `localhost`)
- `POSTGRES_PORT` (optionnel, defaut `5432`)
- `POSTGRES_DATABASE` (optionnel, defaut `backend_platform`)
- `POSTGRES_USER` (optionnel, defaut `backend`)
- `POSTGRES_PASSWORD` (obligatoire hors profil de test)
- `APP_UPLOAD_STORAGE_DIR` (optionnel, defaut `uploads`)
- `APP_UPLOAD_MAX_SIZE_BYTES` (optionnel, defaut `1073741823`, soit strictement inferieur a 1 Go par fichier)
- `APP_UPLOAD_MAX_TOTAL_SIZE_BYTES` (optionnel, defaut `1073741823`)
- `APP_UPLOAD_MAX_FILE_NAME_LENGTH` (optionnel, defaut `120`)
- `APP_UPLOAD_ALLOWED_CONTENT_TYPES` (optionnel, defaut `text/plain,image/png,image/jpeg,application/pdf`)

L'application charge aussi une base PostgreSQL via Flyway:
- table `users` pour l'authentification
- tables `file_assets` et `share_links` en schema cible
- compte de demo seedé en base: `demo / demo123`

Regles upload:

- nom de fichier normalise (caracteres non autorises remplaces)
- nom stocke unique (anti-ecrasement)
- taille max par fichier strictement inferieure a 1 Go
- quota total du dossier d'upload applique
- fichiers stockes sous le dossier configure (`files/`)
- metadonnees fichier et liens de partage stockes en base via JPA (`file_assets`, `share_links`)

Regles de telechargement/partage:

- le telechargement direct reste protege par JWT et reserve au proprietaire du fichier
- la suppression est reservee au proprietaire du fichier et invalide les liens de partage associes
- le lien de partage donne acces sans JWT jusqu'a son expiration
- un lien expire retourne `410 Gone`

```powershell
setx JWT_SECRET "<valeur-locale-aleatoire-au-moins-32-caracteres>"
setx POSTGRES_PASSWORD "<mot-de-passe-bdd-local>"

# Exemples pour lancer l'application en local
# 1) Depuis la racine du repository :
mvn -f backend/user-backend-app/pom.xml spring-boot:run

# 2) Depuis le répertoire `backend` :
cd backend; mvn -f user-backend-app/pom.xml spring-boot:run

# 3) Depuis le répertoire du module `user-backend-app` :
cd backend\user-backend-app; mvn spring-boot:run
```

### Avec Docker Compose

```powershell
docker compose -f ../compose.yaml up --build
```

## Documentation associee

- Contrat API: `../docs/openapi.yaml`
- Plan de test: `../TESTING.md`
- Securite: `../SECURITY.md`
- Performance: `../PERF.md`

