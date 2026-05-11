# Conformite, accessibilite et donnees personnelles

## Perimetre

DataShare est un prototype de partage de fichiers. Cette page documente les decisions minimales attendues pour la soutenance: donnees collectees, retention, droits utilisateur, accessibilite et mentions legales.

## Donnees collectees

- Compte utilisateur: login/email et mot de passe hashe.
- Fichiers televerses: nom original, nom stocke, type MIME, taille, date de creation, proprietaire.
- Liens de partage: token de partage, fichier associe, date d'expiration.
- Evenements securite: echecs de connexion, blocages anti-bruteforce, suppressions, creations de liens.

Les mots de passe de compte et de fichier ne sont pas stockes en clair. Les JWT, mots de passe et tokens complets ne doivent pas apparaitre dans les logs.

## Base legale et finalite

Finalite principale: permettre a un utilisateur authentifie de stocker temporairement un fichier et de creer un lien de partage.

Base legale retenue pour le prototype: execution du service demande par l'utilisateur. En production, les conditions d'utilisation et la politique de confidentialite doivent confirmer cette base ou l'adapter.

## Retention

- Fichiers: conservation jusqu'a suppression par le proprietaire ou expiration d'une politique de retention a definir.
- Liens de partage: expiration applicative via `expiresAt`; les liens expires doivent etre purges par une tache planifiee avant production.
- Logs securite: conservation courte recommandee, par exemple 30 a 90 jours selon le besoin d'audit.
- Comptes: suppression sur demande utilisateur ou fin du service.

## Droits utilisateur

Operations a garantir avant production:

- Droit d'acces: l'utilisateur peut lister ses fichiers et son profil.
- Droit a l'effacement: suppression des fichiers et du compte sur demande.
- Droit de rectification: correction du login/email si le modele fonctionnel le permet.
- Portabilite: export simple des metadonnees utilisateur si demande.

## Mentions legales minimales

Pour un deploiement public, publier une page "Mentions legales" contenant:

- Nom de l'editeur du service.
- Contact de l'editeur.
- Hebergeur et pays d'hebergement.
- Finalite du service.
- Modalites de signalement d'un contenu ou incident.

## Politique de confidentialite minimale

Publier une page "Politique de confidentialite" indiquant:

- Donnees collectees.
- Finalites.
- Duree de conservation.
- Destinataires des donnees.
- Mesures de securite principales.
- Droits utilisateur et contact d'exercice des droits.

## Accessibilite

Actions appliquees dans le front:

- Libelles explicites sur les champs login, register et upload.
- Messages d'erreur exposes avec `role="alert"` et `aria-live`.
- Etats de chargement exposes avec `aria-busy`.
- Navigation clavier conservee sur les formulaires principaux.

Audit a livrer pour une version finale:

- Execution Lighthouse accessibilite sur login, register, upload et espace utilisateur.
- Execution axe-core via Playwright sur les parcours critiques.
- Correction des ecarts WCAG/RGAA avant mise en production.
