---
name: brainstorming
description: Use this skill when the user wants to brainstorm, think through, challenge, or scope a new feature BEFORE implementing it (e.g. "brainstorm", "réfléchissons à cette fonctionnalité", "avant d'implémenter les notifications", "challenge mon idée de feature"). Runs an interactive Q/R brainstorming session that records what is understood and what must be clarified, looks at the topic from a different angle than the author, raises improvements and points of vigilance, ends with a global synthesis, validated UX-focused mockups (faithful to the existing app UI, designed with the available design skills, published as Claude Artifacts for a direct preview, with PNG exports), and an implementation plan that embeds the final mockup images. Never writes source code.
---

Mener une session de brainstorming **interactive** avant d'implémenter une nouvelle fonctionnalité dans l'application : comprendre, questionner, challenger, synthétiser, maquetter, puis proposer un plan d'implémentation.

Ce skill prend un argument : la description (ou le nom) de la fonctionnalité. Dériver un slug kebab-case en anglais (ex. « gestion des notifications » → `notification`).

Tout l'échange avec l'utilisateur est en français. Les identifiants, noms de fichiers et dossiers restent en anglais (règle du repo).

## Registre vivant

Tout au long de la session, tenir à jour et afficher au besoin 4 listes, alimentées à chaque tour :

- **Points compris** : ce qui est établi (besoin, règles, décisions).
- **Points à éclaircir** : questions ouvertes, ambiguïtés, hypothèses non confirmées.
- **Améliorations** : idées qui renforcent la fonctionnalité (validées ou rejetées par l'utilisateur).
- **Points de vigilance** : risques, cas limites, impacts que l'auteur n'a pas forcément mentionnés.

Chaque point porte un identifiant court (`C1`, `Q1`, `A1`, `V1`) pour pouvoir le référencer dans la synthèse et le plan.

## Steps

### 1. Cadrage et contexte du repo

- Lire `CLAUDE.md` et, selon les couches concernées, `docs/angular.md`, `docs/nestjs.md`, `docs/shared.md`.
- Explorer le code des features voisines pour réutiliser l'existant plutôt que le recréer : `packages/merlebleu-api/src/features/{identity,inventory,sale}`, `packages/merlebleu-app/src/app/features/...`, `packages/merlebleu-shared/src/domain/...`.
- Annoncer à l'utilisateur ce qui a été compris du sujet et ce qui existe déjà dans le repo (avec références `fichier:ligne`).

### 2. Round 1 — Compréhension (Q/R)

- Reformuler le besoin en quelques lignes.
- Poser les questions avec `AskUserQuestion` (2 à 4 questions par tour, 2 à 4 options, l'option recommandée en premier avec « (Recommended) »), sur : objectif et valeur métier, utilisateurs et rôles concernés, périmètre (in/out), critères d'acceptation.
- Ne poser aucune question dont la réponse se trouve dans le code ou la documentation.
- Mettre à jour le registre et l'afficher.

### 3. Round 2 — Autre angle

Relire le sujet sous des angles **différents de celui de l'auteur** pour obtenir un avis distinct, en jouant l'avocat du diable :

- utilisateur final non technique (parcours, vocabulaire, erreurs possibles) ;
- sécurité et rôles (qui peut voir / faire quoi ; endpoints exposés) ;
- données et migrations (la base Postgres est partagée entre worktrees) ;
- performance et volumétrie (listes longues, pagination, requêtes) ;
- exploitation et support (logs, erreurs, reprise sur incident) ;
- évolutivité et couplage avec les modules existants ;
- l'alternative « ne pas le construire » ou « une solution plus simple ».

Présenter ces observations, puis poser des questions de challenge via `AskUserQuestion`, avec une recommandation argumentée pour chacune. Mettre à jour le registre.

### 4. Round 3 — Améliorations et vigilance

Remonter ce que l'auteur n'a probablement pas mentionné : cas limites, états vide/erreur/chargement, permissions, validation Zod, rétro-compatibilité des DTO de `@merlebleu/shared`, accessibilité, tests, observabilité, impacts sur les fonctionnalités existantes. Faire accepter, rejeter ou reporter chaque point par l'utilisateur (`AskUserQuestion`, `multiSelect` possible). Mettre à jour le registre.

### 5. Rounds supplémentaires

Tant qu'il reste des « points à éclaircir » à fort impact, enchaîner de nouveaux tours de Q/R. Si un point reste ouvert, il devient une **hypothèse explicite** dans la synthèse — ne jamais le passer sous silence.

### 6. Synthèse globale (obligatoire)

Présenter une synthèse structurée :

1. Points compris
2. Décisions prises
3. Hypothèses et questions restantes
4. Améliorations retenues / rejetées / reportées
5. Points de vigilance
6. Hors périmètre

Demander une validation explicite (`AskUserQuestion`). Ne pas continuer sans accord ; si l'utilisateur corrige, ajuster le registre et re-présenter la synthèse.

### 7. Maquettes HTML

- Lister les écrans, pages et dialogs à créer ou modifier, et les faire confirmer.
- Si la fonctionnalité n'a aucune interface, le signaler, faire confirmer, et passer à l'étape 9.
#### 7.1 Reprendre le langage visuel existant

L'application existe déjà : les maquettes doivent **réutiliser ses éléments visuels** plutôt que d'en inventer.

- Lire `packages/merlebleu-app/src/app/app.config.ts` (preset PrimeNG), les styles globaux / config Tailwind, `packages/merlebleu-app/src/app/layout` et 1 à 2 features voisines (liste, formulaire, dialog).
- Relever : palette, typographie, espacements, composants PrimeNG utilisés (tables, boutons, dialogs, toasts, tags…), navigation/menu, vocabulaire des libellés.
- Reproduire ces éléments à l'identique (mêmes composants, même layout, même menu avec le nouvel écran intégré). N'introduire un nouveau pattern visuel que si l'existant ne couvre pas le besoin, et le signaler explicitement à l'utilisateur.
- Si le repo n'a encore aucune UI de référence, proposer un design cohérent avec la fonctionnalité et le dire.

#### 7.2 Choisir l'outillage de design

- Charger les skills spécialisés en design **s'ils existent** dans la session (consulter la liste des skills disponibles) : `frontend-design:frontend-design` (direction visuelle, typographie), `artifact-design` (obligatoire avant d'écrire un artifact), `artifact-diagramming` (flux, parcours), `dataviz` (graphiques, KPI).
- S'ils n'existent pas, concevoir soi-même un design cohérent avec la nouvelle fonctionnalité (et avec l'UI existante, cf. 7.1).

#### 7.3 Concevoir pour l'expérience utilisateur et l'ergonomie

Prioriser l'UX sur l'esthétique. Pour chaque écran, vérifier :

- parcours le plus court possible vers l'objectif (nombre de clics/étapes), action principale évidente, actions secondaires discrètes ;
- hiérarchie de l'information, regroupement logique des champs, valeurs par défaut pertinentes, validation inline avec messages clairs ;
- états vide / chargement / erreur / succès, retours visuels après chaque action, confirmation avant action destructrice ;
- cohérence avec les écrans existants (emplacement des boutons, vocabulaire, icônes) ;
- accessibilité (contrastes, focus visible, libellés explicites) et responsive (desktop + mobile) ;
- données fictives réalistes en français.

Annoter brièvement dans la réponse les choix UX notables et leur justification.

#### 7.4 Générer les maquettes

- Écrire une maquette HTML par écran : `docs/brainstorming/<slug>/mockups/<screen>.html` (nom en anglais, kebab-case). Fichier autonome (Tailwind via CDN), qui sert de source de vérité versionnée. Si les écrans forment un même parcours, une page unique avec navigation entre écrans est acceptable.
- **Publier chaque maquette dans Claude Artifact** pour un aperçu direct : appeler `Artifact` avec `action: "quickstart"` (une fois par session), puis publier depuis le fichier HTML (`file_path`). Donner le lien à l'utilisateur. Pour toute modification, republier avec le même `file_path`.
- Si Artifact n'est pas disponible, utiliser une alternative proposée par le quickstart (autre type d'artifact, Claude Docs) ; à défaut, ouvrir le HTML dans un **nouvel onglet** `claude-in-chrome`.
- Les PNG ne sont plus l'aperçu principal : les générer seulement une fois un écran validé (cf. étape 8) pour les embarquer dans le plan :
  - Capture headless avec Chrome ou Edge, par exemple :
    `chrome --headless --disable-gpu --hide-scrollbars --window-size=1440,900 --screenshot=<screen>.png file:///<chemin-absolu>/<screen>.html`
    (chercher l'exécutable installé ; sur Windows, `chrome.exe` ou `msedge.exe`).
  - À défaut, capturer via un **nouvel onglet** `claude-in-chrome`.
  - Vérifier que chaque PNG existe et n'est pas vide.

### 8. Round Q/R — validation des maquettes

Présenter les **liens Artifact** de chaque écran, puis ouvrir une nouvelle session interactive (`AskUserQuestion`) portant sur : navigation, disposition, champs, libellés, actions, états, responsive, **ergonomie** (nombre de clics, clarté de l'action principale, cohérence avec les écrans existants). Itérer : modifier le HTML, republier l'artifact (même `file_path`), re-présenter le lien. Continuer jusqu'à validation explicite de **chaque** écran. À la validation d'un écran, générer son PNG (cf. 7.4). Consigner chaque décision dans le registre, et si les maquettes révèlent de nouveaux besoins, mettre à jour la synthèse et le signaler.

### 9. Plan d'implémentation

Regrouper **tous** les points notés (brainstorming + retours sur les maquettes) dans un plan ordonné par dépendance :

1. `@merlebleu/shared` : types, DTO, schémas Zod, puis `npm run generate:barrels`.
2. API (`@merlebleu/api`) : module, entity, migration, service, controller, validation `nestjs-zod`, rôles/guards, Swagger.
3. App (`@merlebleu/ui`) : routes lazy-loaded, composants, services, gestion d'erreurs (interceptors existants).
4. Tests : Jest (API), Karma/Jasmine (app), e2e API.
5. Vérification : lint, build, test manuel, smoke test navigateur.

Chaque étape :

- référence les identifiants du registre qui la motivent (`C2`, `A1`, `V3`…) ;
- référence l'**image de la maquette finale** correspondante : `![<screen>](mockups/<screen>.png)` ;
- mentionne les fichiers existants à réutiliser ;
- liste les risques et l'ordre d'exécution.

Le plan contient une section **« Maquettes finales »** qui embarque toutes les images validées, avec en regard le lien Artifact de chaque écran (aperçu interactif, potentiellement éphémère : les PNG et HTML du repo font foi).

### 10. Sauvegarde et suite

- Demander l'accord avant d'écrire, puis créer `docs/brainstorming/<slug>/plan.md` contenant : synthèse, registre final, plan d'implémentation, section « Maquettes finales ». Les liens d'images sont relatifs (`mockups/<screen>.png`).
- Présenter le plan à l'utilisateur et proposer de lancer le skill `implement-feature` avec ce plan.

## Rules

- La session est **interactive** : au minimum 2 rounds de Q/R, une synthèse validée et un round de validation des maquettes avant tout plan. Ne jamais produire le plan sans ces validations.
- Ne jamais modifier le code source, ne jamais committer ni pusher. Les seules écritures permises sont dans `docs/brainstorming/<slug>/` (`plan.md`, `mockups/*.html`, `mockups/*.png`) ainsi que la publication des maquettes comme artifacts (privés par défaut).
- Maquettes : réutiliser les éléments visuels existants de l'app avant d'innover, privilégier l'UX et l'ergonomie, utiliser les skills de design disponibles, et toujours fournir un aperçu direct (lien Artifact).
- Ne jamais deviner : toute hypothèse est explicitée et soumise à l'utilisateur.
- Chaque question vient avec une recommandation argumentée, pas une liste d'options neutres.
- Questions courtes, groupées par tour ; prioriser les points à fort impact plutôt que d'épuiser l'utilisateur.
- S'appuyer sur le code réel (références `fichier:ligne`), ne pas inventer de composants ou d'API qui n'existent pas.
- Respecter les conventions du repo (CLAUDE.md) : types partagés dans `@merlebleu/shared`, `nestjs-zod`, noms en anglais.
- Ne pas écraser un `docs/brainstorming/<slug>/` existant sans confirmation.
