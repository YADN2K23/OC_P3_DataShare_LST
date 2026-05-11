# ADR-001 - Structure monorepo Maven

## Statut

Accepte

## Decision

Utiliser un monorepo Maven avec 2 modules:
- `auth-core`
- `user-backend-app`

## Consequences

- + Lisibilite et onboarding rapide
- + Build global possible en une commande
- + Versionning coherent entre modules
- - Couplage de release plus fort au debut

## Evolution

Si besoin futur, `auth-core` peut etre extrait dans un repo dedie.

