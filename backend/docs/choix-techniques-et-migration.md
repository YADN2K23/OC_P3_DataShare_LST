# Choix technologiques et plan de migration

## 1. Justification des choix technologiques

### Backend : Spring Boot
Spring Boot est adapté à ce projet car il permet de livrer rapidement une API REST robuste, structurée et testable. Il simplifie la configuration, l'injection de dépendances, la sécurité, la validation et les tests d'intégration.

Dans ce prototype, Spring Boot permet aussi de séparer proprement :
- la logique technique réutilisable (`auth-core`),
- la logique métier (`user-backend-app`).

Ce découpage améliore la maintenabilité et rend le projet plus lisible pour une soutenance.

### Authentification : JWT
Le choix du JWT est pertinent pour une plateforme de transfert de fichiers car :
- l'authentification est stateless,
- le backend reste simple à déployer,
- les endpoints protégés peuvent être sécurisés sans session serveur,
- le modèle est cohérent avec une API consommée par un futur front web.

Le JWT est donc bien adapté à un MVP exposé à des investisseurs : il montre un socle d'authentification moderne et professionnel.

### Stockage fichiers : disque local pour les binaires
Pour le prototype actuel, le stockage local est un choix pragmatique :
- mise en place rapide,
- peu de dépendances externes,
- débogage simple,
- suffisant pour démontrer upload, download, suppression et partage.

Ce choix reste pertinent pour les binaires des fichiers, tandis que la persistance métier des métadonnées est assurée par PostgreSQL via Flyway/JPA.

### Persistance métier : base de données relationnelle comme **réalité du prototype v2**
L'énoncé demande un MCD, ce qui implique une modélisation relationnelle pour les données métier. Cette cible est **désormais implémentée pour les métadonnées métier**. Le modèle comprend :
- `User`
- `FileAsset`
- `ShareLink`

**Status actuel** : Le schéma SQL existe (créé par Flyway) et les métadonnées de fichiers sont persistées en PostgreSQL (voir `docs/data-model.md`).

La base relationnelle restera le bon choix pour :
- garantir l'intégrité référentielle,
- tracer les propriétaires et les partages,
- gérer les suppressions et expirations,
- préparer une montée en charge progressive.


### Déploiement : Docker
Docker est recommandé pour fiabiliser l'exécution et reproduire l'environnement localement ou en CI. Il permettrait d'embarquer :
- le backend,
- la base de données,
- éventuellement un volume de stockage pour les fichiers.

Dans le projet livré, un `compose.yaml` orchestre déjà PostgreSQL et l'application Spring Boot.

### Résumé de positionnement
- **Socle livré** : Spring Boot + JWT + PostgreSQL/Flyway + Docker Compose
- **Stockage des binaires** : disque local / volume Docker
- **Cible propre et soutenable** : même socle, avec durcissement progressif de la persistance et de l'exploitation

---

## 2. Plan de migration vers BDD + Docker

### État actuel
Le prototype actuel fonctionne avec :
- un backend Spring Boot,
- des fichiers stockés sur disque,
- des **comptes utilisateur persistés en PostgreSQL via Flyway** ✅,
- des **métadonnées de fichiers et tokens de partage stockés en PostgreSQL via ORM**, 
- un `compose.yaml` pour lancer PostgreSQL et l'application,
- un stockage binaire local/volumique.

### Cible recommandée
La cible la plus cohérente avec le MCD est (et demeure) :
- une base de données relationnelle pour les métadonnées métier (users, file_assets, share_links),
- un stockage disque ou volume Docker pour les fichiers binaires,
- une application backend containerisée.

Cette cible est **en place dans le projet livré** (comptes et métadonnées en base), avec le stockage binaire conservé sur disque/volume.

### Étape 1 — Introduire la base de données
**Objectif** : préparer la persistance métier.

Actions :
- ajouter la dépendance Spring Data JPA,
- configurer une base PostgreSQL,
- définir les propriétés de connexion par environnement,
- ajouter les migrations de schéma.

Livrable attendu :
- une base opérationnelle pour les entités métier.

> Livré dans le projet : PostgreSQL + Flyway.

### Étape 2 — Créer les entités métier
**Objectif** : aligner le code sur le MCD.

Entités à créer :
- `UserEntity`
- `FileAssetEntity`
- `ShareLinkEntity`

Relations :
- un user possède plusieurs fichiers,
- un fichier possède plusieurs liens de partage,
- un lien appartient à un seul fichier.

### Étape 3 — Migrer les métadonnées hors du disque [RÉALISÉE]
**Objectif historique** : remplacer les fichiers `.properties` par la persistance relationnelle.

**Status** : Les tables et migrations Flyway existent et l'implémentation du service `FileStorageService` s'appuie désormais sur elles pour les métadonnées.

Actions :
- faire porter par la base le propriétaire du fichier,
- faire porter par la base les métadonnées de fichier (original_name, size, content_type, etc.),
- faire porter par la base les tokens de partage et leurs dates d'expiration,
- conserver le binaire du fichier sur disque ou volume.

### Étape 4 — Adapter les services applicatifs
**Objectif** : faire porter la logique métier par la base.

Actions :
- `store(...)` crée une ligne `file_assets`,
- `loadOwnedFile(...)` lit les métadonnées depuis la base,
- `createShareLink(...)` crée une ligne `share_links`,
- `deleteOwnedFile(...)` supprime le fichier et invalide les liens associés.

> Les endpoints d'authentification et les services métier lisent déjà la base PostgreSQL.

### Étape 5 — Dockeriser l'environnement
**Objectif** : rendre le projet reproductible.

Actions :
- ajouter un `Dockerfile` pour le backend,
- ajouter un `docker-compose.yml`,
- lancer la base de données dans un conteneur,
- utiliser un volume pour les fichiers uploadés.

> Livré dans le projet : `compose.yaml` + `Dockerfile` + `.dockerignore`.

### Étape 6 — Adapter les tests
**Objectif** : sécuriser la migration.

Actions :
- mettre en place des tests d'intégration avec base de données de test,
- vérifier upload, download, partage, suppression,
- vérifier les erreurs métier : accès refusé, fichier absent, lien expiré.

### Étape 7 — Sécuriser la livraison
**Objectif** : éviter les régressions.

Actions :
- valider le contrat OpenAPI,
- vérifier les variables d'environnement,
- tester la suppression des fichiers et des liens,
- documenter clairement la procédure de déploiement.

## Priorité recommandée

### Priorité haute
1. Consolidation des tests d'intégration BDD
2. Observabilité et audit
3. Durcissement sécurité/performance

### Priorité moyenne
4. Dockerisation du backend
5. Dockerisation de la base de données
6. Volume persistant pour les fichiers

### Priorité bonus
7. Nettoyage automatique des liens expirés
8. Observabilité avancée
9. Stratégie de sauvegarde/restauration

## Conclusion

La meilleure trajectoire est de conserver le prototype actuel comme preuve fonctionnelle, puis d'élever progressivement la persistance métier vers une base relationnelle complète.

**Étape prioritaire immédiate** : Consolider les tests et les documents autour du socle PostgreSQL déjà en place.

Cela permet de :
- répondre à l'énoncé (MCD documenté et implémenté),
- justifier le modèle relationnel proposé,
- livrer une solution plus crédible et scalable pour une présentation investisseur.

