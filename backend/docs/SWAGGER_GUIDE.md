
# 📚 Documentation API - DataShare Backend

## 🎯 Accès à la Documentation Swagger UI

**URL** : `http://localhost:8080/swagger-ui.html`

**Fichiers générés automatiquement par Spring Doc :**
- **Swagger JSON** : `http://localhost:8080/v3/api-docs`
- **Swagger YAML** : `http://localhost:8080/v3/api-docs.yaml`

---

## 📋 Endpoints API disponibles

### 🔐 Authentification (Public)

#### 1. **POST /api/login**
- **Résumé** : Authentifier l'utilisateur et obtenir un JWT
- **Corps (JSON)** : 
```json
{
  "login": "demo@datashare.local",
  "password": "DemoPass123!"
}
```
- **Réponse (200)** :
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9.eyJsb2dpbiI6ImRlbW8iLCJleHAiOjE2MjU4NzY5NzZ9...."
}
```
- **Codes d'erreur** :
  - `401` : Identifiants invalides
  - `429` : Trop de tentatives (rate limiting)

#### 2. **POST /api/register**
- **Résumé** : Créer un nouveau compte utilisateur
- **Corps (JSON)** :
```json
{
  "login": "user@datashare.local",
  "password": "SecurePassword123!"
}
```
- **Réponse (204)** : Compte créé (pas de contenu)
- **Codes d'erreur** :
  - `400` : Requête invalide
  - `409` : Login déjà utilisé

---

### 👤 Utilisateur (Protégé - Nécessite JWT)

#### 3. **GET /api/me**
- **Résumé** : Obtenir les informations de l'utilisateur authentifié
- **Header requis** : `Authorization: Bearer <JWT_TOKEN>`
- **Réponse (200)** :
```json
{
  "login": "demo@datashare.local"
}
```
- **Codes d'erreur** :
  - `401` : Token absent ou invalide

---

### 📁 Fichiers (Protégé - Nécessite JWT)

#### 4. **GET /api/files** (Pagination)
- **Résumé** : Lister les fichiers de l'utilisateur
- **Header requis** : `Authorization: Bearer <JWT_TOKEN>`
- **Paramètres** :
  - `page` (query) : Numéro de page (défaut: 0)
  - `size` (query) : Nombre de résultats par page (défaut: 20)
- **Réponse (200)** :
```json
{
  "totalElements": 10,
  "totalPages": 1,
  "size": 20,
  "number": 0,
  "content": [
    {
      "storedFileName": "abc123-myfile.txt",
      "originalFileName": "myfile.txt",
      "contentType": "text/plain",
      "size": 1024,
      "createdAt": "2026-05-08T01:19:18Z",
      "passwordProtected": false
    }
  ]
}
```

#### 5. **POST /api/files** (Upload)
- **Résumé** : Uploader un fichier
- **Header requis** : `Authorization: Bearer <JWT_TOKEN>`
- **Content-Type** : `multipart/form-data`
- **Paramètres** :
  - `file` (form) : Fichier à uploader (requis)
  - `password` (form) : Mot de passe optionnel pour protéger le fichier
- **Réponse (200)** :
```json
{
  "storedFileName": "abc123-myfile.txt",
  "originalFileName": "myfile.txt",
  "contentType": "text/plain",
  "size": 1024
}
```
- **Codes d'erreur** :
  - `400` : Fichier vide
  - `413` : Fichier trop volumineux
  - `415` : Type de fichier non autorisé
  - `507` : Quota de stockage dépassé

#### 6. **GET /api/files/{storedFileName}** (Download)
- **Résumé** : Télécharger un fichier propriétaire
- **Header requis** : `Authorization: Bearer <JWT_TOKEN>`
- **Réponse (200)** : Contenu binaire du fichier
- **Codes d'erreur** :
  - `403` : Accès refusé
  - `404` : Fichier non trouvé

#### 7. **DELETE /api/files/{storedFileName}**
- **Résumé** : Supprimer un fichier
- **Header requis** : `Authorization: Bearer <JWT_TOKEN>`
- **Réponse (204)** : Fichier supprimé (pas de contenu)
- **Codes d'erreur** :
  - `403` : Accès refusé
  - `404` : Fichier non trouvé

#### 8. **GET /api/files/history** (Pagination)
- **Résumé** : Historique des actions sur les fichiers
- **Header requis** : `Authorization: Bearer <JWT_TOKEN>`
- **Paramètres** :
  - `page` (query) : Numéro de page
  - `size` (query) : Résultats par page
- **Réponse (200)** :
```json
{
  "totalElements": 5,
  "totalPages": 1,
  "size": 20,
  "number": 0,
  "content": [
    {
      "action": "UPLOAD",
      "storedFileName": "abc123-myfile.txt",
      "originalFileName": "myfile.txt",
      "occurredAt": "2026-05-08T01:19:18Z"
    }
  ]
}
```

---

### 🔗 Partage de Fichiers

#### 9. **POST /api/files/{storedFileName}/shares** (Créer lien)
- **Résumé** : Créer un lien de partage public
- **Header requis** : `Authorization: Bearer <JWT_TOKEN>`
- **Paramètres** :
  - `expiresInSeconds` (query) : Durée d'expiration en secondes (défaut: 3600)
- **Réponse (200)** :
```json
{
  "token": "share-token-123456",
  "shareUrl": "/download/share-token-123456",
  "storedFileName": "abc123-myfile.txt",
  "expiresAt": "2026-05-08T02:19:18Z"
}
```

#### 10. **GET /api/files/shared/{token}** (Download Public)
- **Résumé** : Télécharger via un lien de partage public (SANS authentification)
- **Réponse (200)** : Contenu binaire du fichier
- **Codes d'erreur** :
  - `404` : Lien de partage inexistant
  - `410` : Lien de partage expiré

---

## 🧪 Exemples d'Utilisation

### Avec cURL

```bash
# 1. Login
curl -X POST http://localhost:8080/api/login \
  -H "Content-Type: application/json" \
  -d '{"login":"demo@datashare.local","password":"DemoPass123!"}'

# Récupérer le token depuis la réponse, puis :
TOKEN="<token_obtenu>"

# 2. Lister les fichiers
curl -X GET http://localhost:8080/api/files \
  -H "Authorization: Bearer $TOKEN"

# 3. Uploader un fichier
curl -X POST http://localhost:8080/api/files \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/file.txt"

# 4. Créer un lien de partage
curl -X POST "http://localhost:8080/api/files/abc123-myfile.txt/shares?expiresInSeconds=7200" \
  -H "Authorization: Bearer $TOKEN"
```

### Avec PowerShell

```powershell
# 1. Login
$login = @{
  login = "demo@datashare.local"
  password = "DemoPass123!"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:8080/api/login" \
  -Method Post \
  -ContentType "application/json" \
  -Body $login

$token = $response.token

# 2. Lister les fichiers
$headers = @{ Authorization = "Bearer $token" }
Invoke-RestMethod -Uri "http://localhost:8080/api/files" \
  -Method Get \
  -Headers $headers
```

---

## 🔒 Authentification Bearer JWT

Tous les endpoints protégés nécessitent un token JWT dans le header :

```
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJsb2dpbiI6ImRlbW8i...
```

**Format du token JWT** :
- **Algorithm** : HS256
- **Payload** : { "login": "demo@datashare.local", "exp": 1234567890 }
- **Secret** : Défini dans `JWT_SECRET` (.env)

---

## 📊 Codes de Réponse

| Code | Signification |
|------|---------------|
| **200** | OK - Requête réussie |
| **204** | No Content - Succès sans contenu (suppression) |
| **400** | Bad Request - Requête invalide |
| **401** | Unauthorized - Authentification requise |
| **403** | Forbidden - Accès refusé |
| **404** | Not Found - Ressource non trouvée |
| **409** | Conflict - Login déjà existant |
| **413** | Payload Too Large - Fichier trop volumineux |
| **415** | Unsupported Media Type - Type de fichier non autorisé |
| **429** | Too Many Requests - Rate limiting |
| **507** | Insufficient Storage - Quota dépassé |

---

## 🔍 OpenAPI / Swagger

**Location des fichiers** :
- `datashare-backend/docs/openapi.yaml` - Spécification OpenAPI
- `http://localhost:8080/swagger-ui.html` - Interface Swagger UI
- `http://localhost:8080/v3/api-docs` - JSON OpenAPI (auto-généré)

---

## 📝 Limitations & Règles

- **Authentification JWT** : Expiration par défaut = 24h
- **Rate limiting** : 5 tentatives de login échouées → blockage
- **Taille fichier** : Max 1 GB par fichier
- **Type fichier** : text/plain, image/png, image/jpeg, application/pdf
- **Quota** : 1 GB par utilisateur
- **Partage** : Expiration par défaut = 1h (3600 secondes)

---

**Generated** : 2026-05-08
**API Version** : 1.0.0-SNAPSHOT
**Backend URL** : http://localhost:8080

