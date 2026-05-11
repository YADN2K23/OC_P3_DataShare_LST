# Plan de presentation - projet backend-platform

## Objectif du passage (8-10 min)
Presenter un socle backend professionnel: securite, qualite, modularite, et capacite d'evolution.

## Message principal
Le projet est passe d'un prototype pedagogique a un starter kit presentable en contexte pro:
- domaine generic `user`
- auth reusable dans `auth-core`
- securite et qualite industrialisees (CVE, tests, couverture)

## Trame orale conseillee

### 1) Contexte (1 min)
- Point de depart: base d'exercice
- Cible: socle backend reutilisable et presentable

### 2) Architecture (2 min)
- Monorepo Maven: `auth-core` + `user-backend-app`
- Separation des responsabilites
- Flux auth: `/api/login` -> JWT -> `/api/me`

### 3) Securite (2 min)
- Secrets externalises (variables d'environnement)
- CI avec scan CVE bloqueur (PR + nightly)
- Politique stateless JWT

### 4) Qualite et tests (2 min)
- Tests unitaires + integration
- Cas negatifs renforces
- Couverture JaCoCo globale:
  - INSTRUCTION: 94.63%
  - BRANCH: 81.25%
  - LINE: 94.44%

### 5) Demo live (2 min)
- Login valide -> token
- Appel protege avec token -> 200
- Appel protege sans token -> 401

### 6) Roadmap (1 min)
- Prochaines features metier (upload/partage)
- Eventuelle publication module interne

## Q/R probables
- Pourquoi separer `auth-core`?
- Comment eviter les secrets en dur?
- Quel est le niveau de preuve qualite?
- Quels prochains risques techniques?

