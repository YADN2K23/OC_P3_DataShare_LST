# Script demo - backend-platform

## Pre-check (avant presentation)
1. Etre a la racine `backend-platform`.
2. Variables d'environnement configurees:
   - `JWT_SECRET`
   - `APP_AUTH_DEMO_USER_LOGIN`
   - `APP_AUTH_DEMO_USER_PASSWORD`
3. Demarrer l'app.

## Commandes de lancement (PowerShell)
```powershell
Set-Location "C:\Users\Youssef\DevOps_Dev\Back-end---Testez-et-am-liorez-une-application-existante\backend-platform"
mvn -f pom.xml -pl user-backend-app -am spring-boot:run
```

## Scenario de demo API

### Etape 1 - Login valide
```powershell
$body = '{"login":"demo","password":"demo123"}'
$login = Invoke-RestMethod -Uri "http://localhost:8080/api/login" -Method Post -ContentType "application/json" -Body $body
$token = $login.token
$token
```
Attendu: token JWT non vide.

### Etape 2 - Endpoint protege avec token
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/me" -Headers @{ Authorization = "Bearer $token" }
```
Attendu: reponse 200 avec `login=demo`.

### Etape 3 - Endpoint protege sans token
```powershell
try {
  Invoke-RestMethod -Uri "http://localhost:8080/api/me"
} catch {
  $_.Exception.Response.StatusCode.value__
}
```
Attendu: 401.

## Message de conclusion (30s)
Le socle est maintenant generic (`user`), securise (secrets + scan CVE), et robuste (tests + couverture), pret a recevoir des features metier.

