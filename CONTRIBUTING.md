# Contribution Guide

## Référence de gouvernance

Avant toute contribution, lire d'abord la documentation racine et les guides de versionnement présents dans le dépôt.

Ce fichier définit la source de vérité du projet, les règles de branchement, l'ordre de mise à jour et la logique de suivi.

## Périmètre

Ce dépôt parent doit rester centré sur:

- la configuration globale
- les pointeurs de submodules
- la documentation racine et l'index du projet

Le code applicatif se modifie dans:

- `backend`
- `frontend`

## Branching

- `main` : stable, livrable
- `develop` : intégration courante
- `feature/*`, `fix/*`, `docs/*`, `chore/*`, `release/*` : branches dédiées

## Commits

Utiliser des commits courts et explicites, de type Conventional Commits:

- `feat(scope): ...`
- `fix(scope): ...`
- `docs(scope): ...`
- `chore(scope): ...`
- `ci(scope): ...`
- `test(scope): ...`

Exemples:

- `docs(root): simplify project navigation`
- `ci(github): add coverage workflow`
- `fix(frontend): correct my-space filter test`

## Pull Requests

- 1 objectif technique par PR
- titre clair et descriptif
- tests exécutés avant merge
- vérifier l'impact backend/frontend si pertinent

## Submodules checklist

Avant merge:

1. Le commit du submodule est poussé sur son remote.
2. Le parent référence bien ce commit.
3. `git submodule status` ne montre pas d'état incohérent.
4. La documentation et les notes de suivi du projet sont alignées si le changement touche le suivi.

