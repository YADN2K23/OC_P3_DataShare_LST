# Performance Tests (k6)

Ce dossier contient les scripts de test de performance versionnes.

## Script disponible

- `login_k6.js`: charge sur `POST /api/login`
- `files_k6.js`: parcours authentifie `GET /api/files`, upload TXT, download

## Prerequis

Installer k6:

```powershell
winget install k6
```

Verifier:

```powershell
k6 version
```

## Execution rapide

```powershell
k6 run .\perf\login_k6.js
k6 run .\perf\files_k6.js
```

## Execution parametree

```powershell
$env:BASE_URL="http://localhost:8080"
$env:LOGIN_USER="demo"
$env:LOGIN_PASSWORD="demo123"
$env:VUS="30"
$env:DURATION="2m"
k6 run .\perf\login_k6.js
k6 run .\perf\files_k6.js
```

## Metriques suivies

- `http_req_duration` (avec seuils p95/p99)
- `http_req_failed`
- checks `status 200` et `token present`
- checks pagination (`content`), upload et download pour `files_k6.js`

## Rapports versionnes

- `REPORT_2026-05-07.md`: tentative locale du 2026-05-07, k6 present, backend `localhost:8080` non disponible pendant la session.

## Sortie recommandee pour la soutenance

Conserver pour chaque run:

- date/heure
- environnement (machine, backend local/docker)
- parametres (`VUS`, `DURATION`)
- p95, p99, taux d'erreur
- conclusion (conforme/non conforme)

