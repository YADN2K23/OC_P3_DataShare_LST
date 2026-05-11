# Architecture du starter kit

## Objectif

Avoir une base lisible, reutilisable et versionnable pour l'authentification JWT.

## Modules

### `auth-core`

Contient le coeur technique reutilisable:
- configuration JWT (`jwt.secret`, `jwt.expiration-millis`)
- service de generation/validation de token
- auto-configuration Spring Boot

### `user-backend-app`

Contient la logique applicative du domaine user:
- endpoint `/api/login`
- filtre JWT HTTP
- regles d'autorisation (`SecurityFilterChain`)
- endpoint protege de demonstration (`/api/me`)
- persistance PostgreSQL/Flyway pour les comptes utilisateur
- cycle fichier complet: upload, download protege, suppression proprietaire, creation de lien de partage et download public via token

## Principe de separation

- Ce qui depend du domaine metier reste dans l'application.
- Ce qui est purement technique et reutilisable va dans `auth-core`.
- Le socle d'execution local est compose avec PostgreSQL pour la persistence et un stockage fichier local pour les binaires du prototype.

