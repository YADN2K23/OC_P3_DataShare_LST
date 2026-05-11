# 🔧 MAINTENANCE

Ce document s'applique à l'ensemble du projet DataShare (backend + frontend).

## Objectif

Définir une base de maintenance technique du prototype pour garantir sa stabilité dans le temps.

## Routine recommandée

### Hebdomadaire

- Vérification des dépendances (nouvelles versions/corrections)
- Revue des alertes de sécurité (CVE)
- Vérification rapide des tests sur `develop`

### Mensuelle

- Mise à jour des dépendances non critiques
- Revue des warnings de déprécation
- Revue de la documentation d'exploitation
- Réévaluation des risques sécurité/performance ouverts

## Procédure de mise à jour des dépendances

### Backend (Maven/Spring Boot)

1. Créer une branche `chore/deps-backend-YYYY-MM`
2. Mettre à jour les dépendances (patch/minor d'abord)
3. Lancer les tests:

```powershell
cd backend
mvn -f pom.xml clean test
```

4. Vérifier les impacts de sécurité/performance
5. Ouvrir une PR dédiée avec plan de rollback

### Frontend (Angular/Node)

1. Créer une branche `chore/deps-frontend-YYYY-MM`
2. Mettre à jour les dépendances:

```powershell
cd frontend/webapp
npm audit
npm update --save-dev
npm run test:ci
```

3. Vérifier la couverture de tests
4. Ouvrir une PR dédiée

## Gestion des incidents (minimal)

- Reproduire le problème avec logs + contexte
- Isoler la cause (backend/frontend)
- Corriger sur branche `fix/*`
- Rejouer tests unitaires + intégration
- Déployer via procédure standard (Docker Compose)

## Rotation des secrets

Objectif: remplacer régulièrement les secrets applicatifs sans les committer dans Git.

Secrets concernés:

- `JWT_SECRET` (backend)
- `POSTGRES_PASSWORD` (database)
- Tout secret exposé via un environnement de déploiement

### Rotation de `JWT_SECRET`

1. Générer une nouvelle valeur aléatoire d'au moins 32 caractères
2. Mettre à jour dans `.env` local ou gestionnaire de secrets
3. Redémarrer le conteneur `backend`
4. Tous les anciens access tokens deviennent invalides
5. Vérifier que `POST /api/login`, `GET /api/me` fonctionnent

### Rotation du mot de passe PostgreSQL

1. Créer/modifier le mot de passe côté PostgreSQL pendant une fenêtre de maintenance
2. Mettre à jour `POSTGRES_PASSWORD` dans `.env` ou gestionnaire de secrets
3. Redémarrer les conteneurs (Backend + Database)
4. Vérifier la connexion applicative

### Règles de contrôle

- ❌ Ne jamais stocker de secret réel dans `compose.yaml`, `application.yml` ou la documentation
- ✅ Conserver uniquement `.env.example` dans Git
- 🔴 Après suspicion de fuite: tourner le secret immédiatement

## Procédure d'exploitation - Reset compte exploratoire

Objectif: Repartir d'une base utilisateur propre puis recréer un compte unique pour tests exploratoires.

### Prérequis

- Stack Docker démarrée: `docker compose up --build`
- API accessible: `http://localhost:8080/api`
- Frontend accessible: `http://localhost:4200`

### Procédure (Backend)

1. Purger tous les comptes (cascade vers fichiers et partages):

```powershell
docker exec datashare-postgres psql -U datashare -d datashare -c "DELETE FROM users; SELECT COUNT(*) AS users_count FROM users;"
```

2. Recréer un compte de test via API:

```powershell
$body = '{"login":"test@datashare.local","password":"TestPass123!"}'
Invoke-RestMethod -Uri 'http://localhost:8080/api/register' `
  -Method Post -ContentType 'application/json' -Body $body

Invoke-RestMethod -Uri 'http://localhost:8080/api/login' `
  -Method Post -ContentType 'application/json' -Body $body
```

3. Valider l'état final:

```powershell
docker exec datashare-postgres psql -U datashare -d datashare `
  -c "SELECT COUNT(*) FROM users; SELECT login FROM users;"
```

## Risques techniques connus

- Couverture frontend à renforcer (cible: 70%)
- Endpoint métier de transfert de fichiers non encore implémenté
- Rotation multi-clé JWT sans interruption pour amélioration future

## Plan d'amélioration

1. ✅ JaCoCo + seuil de couverture en CI (backend fait)
2. ⏳ Scan CVE automatique en pipeline
3. ⏳ Tests de non-régression sur scénarios critiques
4. ⏳ Formaliser la release (tag + changelog)

## Critère de sortie de maintenance par release

- ✅ Tests `clean test` passent (backend: 44/44, frontend: 71/71)
- ✅ Aucun incident bloquant ouvert
- ✅ Documentation d'exploitation synchronisée avec le code livré

---

**Pour les détails spécifiques:**
- Backend: voir `backend/MAINTENANCE.md`
- Frontend: voir `frontend/MAINTENANCE.md` (si applicable)

