# INIT — Guide de démarrage et consignes de développement

> **Document de référence pour le développeur Fullstack chargé de réaliser le MVP.**
>
> Dépôt : `MondoukpeStella/agri-assistant-benin`  
> Produit : assistant conversationnel agricole pour la consultation de prix  
> Statut : cadrage MVP — certaines décisions fournisseur et voix restent à confirmer.

Ce document définit le cadre de travail. Il complète le PRD, `docs/PRODUCT_SCOPE.md` et les issues GitHub. En cas de contradiction ou d'information manquante, **ne choisis pas toi-même : suspends la partie concernée et demande une décision à la responsable du projet**.

---

# 1. Vue d'ensemble du projet

## 1.1. Objectif

Développer une application mobile Android qui permet à un agriculteur au Bénin de demander, par écrit ou par la voix selon la langue choisie, le prix du maïs ou du riz sur les marchés couverts par le MVP.

L'application doit fournir une information compréhensible et fiable. Elle ne doit jamais inventer, estimer ou présenter comme actuel un prix qui n'est pas confirmé par une donnée validée.

## 1.2. Périmètre fonctionnel du MVP

| Élément | Périmètre retenu |
|---|---|
| Utilisateurs | Agriculteurs uniquement |
| Plateforme | Application Android |
| Produits | Maïs et riz |
| Marchés | Natitingou (Atacora) et Savalou (Collines) |
| Langues | Français et fon |
| Français | Saisie et réponse écrites ; entrée et sortie vocales |
| Fon | Voix uniquement ; pas de saisie ni de réponse écrite en fon |
| Source de prix | API AgroFlux Bénin, sous réserve de confirmation du contrat et de la couverture |
| Historique | Stockage local des conversations pendant 7 jours |
| Connexion | Internet nécessaire pour toute nouvelle consultation |
| Comptes | Aucun compte, mot de passe, OTP ou profil utilisateur dans le MVP |

L'application est spécialisée dans la consultation des prix. Les demandes sans rapport avec cette fonction doivent être redirigées poliment vers le sujet.

Pour un produit ou un marché hors périmètre, l'assistant explique la limite. Pour un marché non couvert, il peut proposer Natitingou ou Savalou comme alternatives.

## 1.3. Comportement métier essentiel

- Si le produit ou le marché manque ou est ambigu, demander uniquement la précision nécessaire.
- Si la demande est claire, ne pas ajouter de question inutile.
- Une réponse de prix contient au maximum un prix.
- Seules les données validées et suffisamment complètes peuvent être affichées.
- Si aucune donnée validée n'est disponible, le dire clairement.
- Si l'API est indisponible, afficher une erreur et proposer une nouvelle tentative. Ne jamais réutiliser une ancienne valeur comme prix actuel.
- Afficher le montant avec sa devise, son unité et sa date de collecte lorsque ces informations sont disponibles et confirmées.
- Ne pas convertir sac, bassine et kilogramme sans équivalence officiellement confirmée.
- Ne pas calculer de moyenne, de tendance ou de comparaison et ne pas recommander à l'agriculteur de vendre ou d'attendre.
- Les anciennes réponses restent consultables dans l'historique, avec leur date et un marquage historique clair. Elles ne sont jamais présentées comme une nouvelle consultation.

## 1.4. Parcours vocal prévu

Le parcours cible pour le fon utilise le français comme langue pivot :

1. L'utilisateur prononce sa demande en fon.
2. Le service vocal reconnaît et traduit/transcrit la demande en français.
3. Le système identifie le produit et le marché.
4. Le backend applique les règles métier et consulte la source de prix.
5. La réponse française est traduite en fon.
6. Une synthèse vocale restitue la réponse en fon.

La faisabilité et la qualité STT/traduction/TTS en fon doivent être évaluées avec des locuteurs natifs. Ne considère pas une technologie comme compatible simplement parce qu'elle prend en charge d'autres langues africaines. En cas d'incertitude sur la demande reconnue, demander confirmation avant toute consultation.

## 1.5. Ce que le développeur Fullstack aura à réaliser

Le développeur est responsable de la réalisation technique de bout en bout, en respectant les issues et les décisions validées :

- initialiser le monorepo et les environnements mobile/backend ;
- développer l'application Android React Native ;
- développer l'API FastAPI et les services métier ;
- définir et maintenir le modèle interne des observations de prix ;
- intégrer PostgreSQL lorsque la persistance serveur est requise ;
- intégrer AgroFlux uniquement à partir de sa documentation officielle et des accès autorisés ;
- mettre en place l'historique local SQLite avec expiration à 7 jours ;
- connecter l'application au backend ;
- évaluer puis intégrer la chaîne vocale française/fon après validation ;
- écrire les tests automatisés et les tests manuels documentés ;
- documenter les décisions structurantes, les contrats et les procédures ;
- sécuriser le code, les dépendances, les secrets, les échanges réseau et les données ;
- préparer le lancement et la livraison du MVP.

Le développeur ne doit pas élargir le périmètre fonctionnel sans accord explicite.

---

# 2. Documentation de référence et ordre de priorité

Avant toute modification, lire dans cet ordre :

1. `README.md` — présentation et démarrage du dépôt ;
2. `docs/PRODUCT_SCOPE.md` — périmètre et règles produit ;
3. le PRD du projet — parcours et exigences fonctionnelles ;
4. `docs/ISSUE_TEMPLATE.md` — format obligatoire des issues ;
5. l'issue GitHub à traiter et ses éventuelles dépendances ;
6. les décisions d'architecture dans `docs/architecture/` et `docs/decisions/`.

En cas de contradiction :
- ne pas choisir silencieusement le document qui semble le plus récent ;
- relever précisément les deux informations contradictoires ;
- demander un arbitrage à la responsable du projet ;
- documenter la décision retenue avant de poursuivre.

---

# 3. Stack technique imposée

| Couche | Technologie |
|---|---|
| Monorepo | Git + GitHub |
| Mobile Android | React Native |
| Environnement mobile | Expo |
| Langage mobile | JavaScript |
| Backend | Python + FastAPI |
| Base serveur | PostgreSQL |
| Historique local mobile | SQLite |
| API | REST/JSON |
| Conteneurisation | Docker + Docker Compose pour l'environnement local et les services concernés |
| Gestion des dépendances JS | npm et lockfile `package-lock.json` |
| Gestion des dépendances Python | environnement virtuel Python et fichier de dépendances verrouillé selon l'outil retenu |
| Tests mobile | Jest et React Native Testing Library, si compatibles avec la version Expo retenue |
| Tests backend | pytest et client de test FastAPI |
| Qualité Python | Ruff ; typage statique à introduire si validé dans le socle |
| Qualité JavaScript | ESLint et Prettier |
| Sécurité dépendances | npm audit et pip-audit, avec analyse des alertes |
| Détection de secrets | Gitleaks |
| Contrôle de sécurité Python | Bandit |
| CI | GitHub Actions |

Les versions exactes doivent être compatibles entre elles, documentées et verrouillées. Ne mets pas à jour arbitrairement une dépendance majeure en cours de réalisation.

Les fournisseurs STT, traduction et TTS ne sont pas encore définitivement choisis. Ne crée pas de dépendance à un fournisseur vocal avant l'évaluation et l'accord de la responsable du projet.

---

# 4. Structure du monorepo

Adopter une structure monorepo. Le mobile et le backend vivent dans le même dépôt Git, mais leurs dépendances, configurations et tests restent séparés.

```text
agri-assistant-benin/
├── mobile/
│   ├── src/
│   │   ├── components/
│   │   ├── screens/
│   │   ├── navigation/
│   │   ├── services/
│   │   ├── storage/
│   │   ├── hooks/
│   │   ├── constants/
│   │   └── utils/
│   ├── assets/
│   ├── tests/
│   ├── app.json
│   ├── package.json
│   └── README.md
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   ├── core/
│   │   ├── schemas/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── services/
│   │   ├── integrations/
│   │   │   └── agroflux/
│   │   └── main.py
│   ├── migrations/
│   ├── tests/
│   │   ├── unit/
│   │   └── integration/
│   ├── pyproject.toml
│   └── README.md
│
├── docs/
│   ├── PRODUCT_SCOPE.md
│   ├── ISSUE_TEMPLATE.md
│   ├── architecture/
│   │   ├── BACKEND_CONTEXT.md
│   │   ├── DATA_FLOW.md
│   │   └── INTEGRATIONS.md
│   ├── decisions/
│   │   ├── README.md
│   │   └── ADR-000-template.md
│   ├── api/
│   ├── integrations/
│   │   └── agroflux.md
│   ├── testing/
│   └── operations/
│
├── scripts/
├── .github/
│   ├── workflows/
│   ├── ISSUE_TEMPLATE/
│   └── pull_request_template.md
│
├── .gitignore
├── .dockerignore
├── .gitleaks.toml
├── .pre-commit-config.yaml
├── docker-compose.yml
├── README.md
└── init.md
```

Cette structure est une cible. Si une adaptation est nécessaire, explique pourquoi et demande validation avant de modifier l'organisation générale.

Ne crée pas des dossiers vides sans utilité. Les modules internes peuvent évoluer, mais la séparation mobile/backend/docs doit être conservée.

---

# 5. Règles de développement et workflow GitHub obligatoire

## 5.1. Authentification GitHub

Utiliser exclusivement GitHub CLI (`gh`) pour consulter les issues, branches, pull requests et le dépôt.

Au début de la mission :

```bash
gh auth login
gh auth status
gh repo view MondoukpeStella/agri-assistant-benin
```

- Se connecter avec le compte GitHub autorisé à contribuer au dépôt.
- Ne jamais demander, copier ou enregistrer un mot de passe ou un token dans un fichier du projet.
- Ne jamais contourner une permission GitHub.
- Si l'accès échoue, arrêter et demander à la responsable du projet de vérifier les droits.

## 5.2. Récupérer les issues en local

Créer un dossier de travail local, non versionné, pour conserver les descriptions des issues traitées :

```bash
mkdir -p .local/issues
```

Récupérer la liste des issues ouvertes :

```bash
gh issue list --repo MondoukpeStella/agri-assistant-benin --state open --limit 100
```

Avant de commencer une issue, récupérer son contenu complet :

```bash
gh issue view <NUMERO> \
  --repo MondoukpeStella/agri-assistant-benin \
  --json number,title,body,labels,state,url \
  > .local/issues/ISSUE-XXX.json
```

Le dossier `.local/` doit être ajouté au `.gitignore`. Les snapshots locaux peuvent contenir des éléments de travail et ne doivent pas être poussés sur GitHub.

Lire intégralement l'issue, ses critères d'acceptation, ses use cases, ses edge cases et ses dépendances avant de coder.

## 5.3. Une issue à la fois

Le développeur travaille sur **une seule issue à la fois**.

Pour chaque issue :

1. Vérifier qu'elle est ouverte et que ses prérequis sont satisfaits.
2. Lire le contexte, les règles métier, les use cases, les edge cases et les tests obligatoires.
3. Identifier les fichiers concernés et proposer une approche courte.
4. Signaler toute ambiguïté avant de commencer la partie concernée.
5. Créer une branche dédiée depuis la branche de référence à jour.
6. Implémenter uniquement le périmètre de l'issue.
7. Exécuter les tests et contrôles qualité/sécurité.
8. Présenter le diff, les fichiers modifiés, les résultats de tests et les éventuels points d'attention à la responsable du projet.
9. **Attendre son accord explicite avant tout push.**
10. Après accord, pousser la branche.
11. Présenter l'état de la branche et attendre un nouvel accord explicite avant d'ouvrir la Pull Request.
12. Ouvrir une PR liée à l'issue, avec résumé, choix techniques, tests exécutés, captures si utiles et limites connues.
13. Demander la revue de la PR. Ne pas fusionner soi-même.
14. Corriger les remarques de revue, relancer les tests et demander une nouvelle validation si nécessaire.
15. Attendre la validation/merge de la PR avant de passer à l'issue suivante.

**Il est interdit de passer à l'issue suivante tant que la PR de l'issue en cours n'a pas été examinée et validée par la responsable du projet.**

## 5.4. Convention de branches et commits

Une branche par issue, avec un nom explicite :

```text
issue-001/setup-expo-mobile
issue-002/setup-fastapi
issue-003/agroflux-api-contract
issue-004/mobile-chat-ui
```

Ne jamais développer directement sur `main`.

Convention de commits recommandée :

```text
feat(mobile): initialize Expo application
feat(api): add price query endpoint
fix(storage): correct conversation expiration
test(api): cover invalid price observations
docs(architecture): record backend decision
```

Ne pas mélanger plusieurs issues dans une même branche ou une même PR. Si une dépendance impose une modification préalable dans une autre issue, demander un arbitrage.

## 5.5. Contrôle obligatoire avant push et avant PR

Il y a deux validations distinctes :

- **Avant le push :** transmettre le diff local, les fichiers concernés, les tests lancés et leurs résultats. Attendre l'autorisation explicite.
- **Avant l'ouverture de la PR :** après le push autorisé, transmettre le lien de branche/commit et attendre l'autorisation explicite d'ouvrir la PR.

Ne considère jamais une absence de réponse comme un accord. Ne pousse pas « pour gagner du temps ».

## 5.6. Pull Request

Chaque PR doit :

- référencer l'issue, par exemple `Closes #1` ;
- expliquer le problème et la solution ;
- lister les changements fonctionnels et techniques ;
- indiquer les tests exécutés et leur résultat ;
- mentionner les limites, hypothèses et décisions prises ;
- fournir des captures ou exemples de requêtes/réponses si cela facilite la revue ;
- confirmer qu'aucun secret ou fichier `.env` n'est inclus.

La PR doit rester focalisée sur une seule issue. La responsable du projet effectue la revue et décide de l'acceptation.

---

# 6. Gestion des variables d'environnement et des secrets

## 6.1. Règle absolue

**Aucun fichier `.env`, secret, token, mot de passe, clé API ou certificat privé ne doit être envoyé sur GitHub.**

Cette règle s'applique aux commits, branches, PR, issues, logs, captures d'écran et exemples de documentation.

Fichiers locaux possibles :

- `mobile/.env`
- `backend/.env`
- fichiers de secrets Docker locaux, si nécessaires.

Ces fichiers doivent être ignorés par Git. Seuls des fichiers d'exemple contenant des valeurs fictives et non sensibles peuvent être versionnés :

- `mobile/.env.example`
- `backend/.env.example`

Exemple acceptable :

```env
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/DB_NAME
AGROFLUX_BASE_URL=https://example.invalid
AGROFLUX_API_KEY=replace_me_locally
```

Les valeurs d'exemple ne doivent jamais être des identifiants réels ou des URL privées.

## 6.2. Contrôles à mettre en place

- Compléter `.gitignore` pour les fichiers `.env`, secrets, clés privées, certificats, caches, bases locales, logs, builds et dossiers temporaires.
- Configurer Gitleaks en local et dans la CI.
- Installer un hook pre-commit pour lancer la détection de secrets avant chaque commit.
- Ajouter une vérification du contenu staged avant commit.
- Ne jamais imprimer la valeur d'une variable secrète dans les logs.
- Ne jamais placer une clé API dans le code mobile : une clé fournisseur privée doit rester côté backend.
- Si un secret est exposé, arrêter immédiatement, prévenir la responsable, révoquer/renouveler le secret et traiter l'historique Git. Supprimer le fichier du dernier commit ne suffit pas à rendre un secret déjà publié sûr.

Vérifier régulièrement :

```bash
git status --short
git diff --check
git diff --cached --check
gitleaks detect --source . --no-git
```

La commande Gitleaks doit être adaptée à la version installée ; le contrôle doit aussi être exécuté sur l'historique Git dans la CI.

---

# 7. Documentation obligatoire des décisions backend

Le backend concentre les règles métier et les intégrations externes. Ses choix doivent être conservés dans le dépôt afin qu'un développeur, un assistant ou un futur contributeur puisse retrouver le contexte sans dépendre de la mémoire d'une conversation.

## 7.1. Fichiers de référence

Créer et maintenir :

- `docs/architecture/BACKEND_CONTEXT.md` : rôle du backend, architecture, responsabilités des modules, flux de données, règles métier appliquées côté serveur, gestion des erreurs et conventions.
- `docs/architecture/DATA_FLOW.md` : parcours d'une demande depuis le mobile jusqu'à la réponse.
- `docs/architecture/INTEGRATIONS.md` : dépendances externes, limites, authentification, disponibilité et stratégie d'erreur.
- `docs/integrations/agroflux.md` : contrat réel AgroFlux, champs, exemples expurgés, quotas, statuts de validation et fraîcheur.
- `docs/decisions/` : décisions d'architecture et décisions métier structurantes.

## 7.2. ADR — Architecture Decision Records

Toute décision structurante doit faire l'objet d'un ADR, par exemple :

```text
docs/decisions/ADR-001-backend-structure.md
docs/decisions/ADR-002-price-observation-model.md
docs/decisions/ADR-003-agroflux-adapter.md
```

Chaque ADR doit contenir :

- Contexte et problème à résoudre ;
- Options examinées ;
- Décision retenue ;
- Justification ;
- Conséquences positives et négatives ;
- Alternatives rejetées ;
- Statut : proposé, accepté, remplacé ou abandonné ;
- Date et référence à l'issue/PR concernée.

Ne documente pas une hypothèse comme une décision acceptée. Les décisions provisoires doivent être clairement identifiées.

## 7.3. Mise à jour continue

Lorsqu'une PR modifie une architecture, une règle métier, un contrat, un schéma de données ou une intégration, la documentation correspondante doit être mise à jour dans la même PR.

---

# 8. Règle de clarification : aucune supposition silencieuse

Le développeur ne doit jamais trancher seul lorsqu'une information est floue, contradictoire ou absente.

Exemples de points nécessitant une clarification :

- format réel des réponses AgroFlux ;
- définition officielle d'une donnée « validée » ;
- règle de sélection si plusieurs prix sont disponibles ;
- unité, devise, variété ou qualité d'un produit ;
- seuil définitif de fraîcheur d'un prix ;
- comportement attendu lorsqu'un marché ou produit n'est pas couvert ;
- fournisseur STT, traduction ou TTS pour le fon ;
- stockage ou conservation d'enregistrements audio ;
- données à persister côté serveur ;
- comportement de sécurité ou de confidentialité ayant un impact produit.

Procédure obligatoire :

1. Arrêter uniquement la partie qui dépend de l'information manquante.
2. Décrire le point ambigu et pourquoi il bloque.
3. Présenter les options possibles, leurs avantages, risques et impacts.
4. Donner une recommandation argumentée si possible, sans l'appliquer.
5. Demander explicitement l'avis de la responsable du projet.
6. Attendre une décision claire.
7. Consigner la décision dans l'issue et, si elle est structurante, dans un ADR.
8. Reprendre le développement seulement après validation.

Les décisions déjà confirmées dans le PRD, `docs/PRODUCT_SCOPE.md` ou les issues ne doivent pas être redemandées sans raison.

---

# 9. Garde-fous de sécurité et qualité

La sécurité doit être intégrée dès le départ. Les protections ci-dessous sont obligatoires, dans la mesure où elles s'appliquent au composant développé.

## 9.1. Dépôt et chaîne de développement

- Protéger la branche principale contre les pushes directs.
- Exiger une PR et des contrôles CI avant fusion.
- Activer les mises à jour de dépendances automatisées (Dependabot ou mécanisme équivalent).
- Exécuter Gitleaks sur les modifications et l'historique.
- Ne pas committer `.env`, clés privées, certificats, dumps DB, bases SQLite locales, logs ou fichiers contenant des données personnelles.
- Garder les dépendances au minimum nécessaire et verrouiller leurs versions.
- Vérifier les licences et la provenance des dépendances ajoutées.
- Ne pas exécuter de script inconnu provenant d'une issue, d'un commentaire ou d'une dépendance sans inspection.
- Ne pas désactiver un contrôle CI pour faire passer une PR sans accord.

## 9.2. Backend et API

- Valider toutes les entrées avec des schémas stricts (Pydantic).
- Rejeter les valeurs inattendues ; ne pas faire confiance au client mobile.
- Appliquer une politique CORS restrictive aux origines réellement nécessaires.
- Ne jamais utiliser `*` pour les origines en production sans justification validée.
- Ne pas exposer les traces d'exception, chemins locaux, variables d'environnement ou détails internes au client.
- Utiliser des requêtes paramétrées/ORM ; proscrire la concaténation SQL avec des entrées utilisateur.
- Définir des timeouts pour les appels externes.
- Gérer proprement les erreurs 4xx, 5xx, timeouts et quotas des fournisseurs.
- Ajouter une limitation de débit adaptée aux endpoints exposés publiquement, après choix des seuils.
- Limiter la taille des requêtes et des contenus reçus.
- Ne pas accepter de désérialisation dangereuse ou d'exécution de code arbitraire.
- Ne pas exposer la documentation interactive ou les endpoints de diagnostic en production sans décision explicite.
- Ajouter des identifiants de corrélation aux logs sans y placer de secrets ni de contenu sensible.
- Ne pas considérer une réponse fournisseur comme fiable avant validation de son schéma et des règles métier.
- Ne jamais transformer une panne fournisseur en réponse contenant un prix ancien.

## 9.3. Base de données

- Utiliser un compte PostgreSQL avec les privilèges minimaux nécessaires.
- Ne pas utiliser le superutilisateur PostgreSQL pour l'application en production.
- Garder les identifiants hors du dépôt.
- Versionner les migrations.
- Paramétrer les connexions et timeouts.
- Ne pas exposer PostgreSQL directement sur Internet.
- Séparer les bases de développement, test et production.
- Les tests ne doivent jamais supprimer ou modifier la base de développement/production.
- Ne pas persister des données personnelles ou audio sans décision produit et règles de conservation validées.

## 9.4. Application mobile

- Ne jamais intégrer de secret fournisseur dans l'application.
- Utiliser HTTPS pour les environnements distants.
- Ne pas enregistrer de données sensibles dans les logs.
- Ne pas afficher une réponse de prix comme actuelle lorsqu'elle provient de l'historique.
- Vérifier les permissions micro au moment utile et expliquer leur usage.
- Ne pas enregistrer l'audio par défaut.
- Gérer les erreurs réseau sans exposer de détails techniques.
- Ne pas stocker localement de token d'accès inutile puisqu'aucun compte utilisateur n'est prévu dans le MVP.
- Limiter et purger l'historique local conformément à la règle de 7 jours.

## 9.5. Dépendances et conteneurs

- Utiliser des images Docker officielles et maintenues, avec versions explicites.
- Éviter les images `latest` pour les environnements reproductibles.
- Ne pas exécuter les conteneurs applicatifs en root lorsque ce n'est pas nécessaire.
- Ne pas monter le socket Docker dans un conteneur applicatif.
- Limiter les ports exposés.
- Ne pas intégrer de secret dans une image ou une couche Docker.
- Scanner les dépendances et images lorsque l'outil est disponible.
- Corriger les vulnérabilités critiques/élevées avant livraison ; toute exception doit être documentée et approuvée.

## 9.6. Contrôles automatisés attendus

Configurer une CI GitHub Actions qui exécute au minimum :

**Mobile**
- installation reproductible depuis le lockfile ;
- lint et format check ;
- tests unitaires ;
- vérification de build/export lorsque pertinente ;
- audit des dépendances.

**Backend**
- installation reproductible ;
- Ruff (lint et format check) ;
- tests pytest ;
- vérification de typage si configurée ;
- Bandit ;
- pip-audit.

**Dépôt**
- Gitleaks ;
- vérification des fichiers sensibles ;
- contrôle des changements de configuration ;
- vérification Docker si des fichiers Docker sont modifiés.

Les commandes et versions exactes doivent être documentées dans les README respectifs. Une PR ne doit pas être considérée prête si un contrôle obligatoire échoue.

---

# 10. Tests et exigences de validation

Chaque issue définit ses propres tests obligatoires. Ils doivent tous être exécutés avant de demander une revue.

Principes :

- Tester les cas nominaux, les validations négatives et les edge cases de l'issue.
- Ajouter des tests unitaires pour les règles métier.
- Ajouter des tests d'intégration pour les routes, la base et les adaptateurs.
- Simuler les erreurs réseau, timeouts et réponses fournisseur invalides.
- Utiliser des fixtures synthétiques identifiées comme telles.
- Ne jamais utiliser des données fictives dans une réponse présentée comme un prix réel.
- Tester qu'aucun prix n'est affiché sans statut de validation, montant, unité, devise et date nécessaires.
- Tester que l'historique expiré n'est plus accessible après 7 jours.
- Tester le comportement hors ligne.
- Pour la voix en fon, faire évaluer les résultats par des locuteurs natifs ; un test technique seul ne suffit pas.

Dans le compte rendu avant push, fournir :

- commandes exécutées ;
- résultat de chaque commande ;
- tests réussis/échoués ;
- couverture si disponible ;
- contrôles sécurité effectués ;
- limites connues ;
- captures ou exemples pertinents.

Ne jamais prétendre qu'un test a réussi s'il n'a pas été exécuté.

---

# 11. Ordre de travail et dépendances

Les issues existantes constituent le backlog initial. Respecter leurs identifiants et leur contenu :

| Issue | Sujet | Dépendance / remarque |
|---|---|---|
| ISSUE-001 | Initialiser l'application React Native avec Expo | Socle mobile |
| ISSUE-002 | Initialiser le backend FastAPI | Socle backend |
| ISSUE-003 | Obtenir et documenter le contrat API AgroFlux | Bloquante pour l'intégration réelle |
| ISSUE-004 | Construire l'accueil, le choix de langue et l'écran de conversation | Dépend du socle mobile |
| ISSUE-005 | Définir le modèle métier d'une observation de prix | Dépend du contrat réel pour les mappings définitifs |
| ISSUE-006 | Enregistrer l'historique local pendant 7 jours | Dépend du socle mobile |
| ISSUE-007 | Implémenter l'endpoint de consultation d'un prix | Dépend du modèle métier et du contrat fournisseur |
| ISSUE-008 | Évaluer STT et TTS en fon | Spike indépendant, à traiter tôt en raison du risque |
| ISSUE-009 | Configurer PostgreSQL et les migrations | Dépend des besoins de persistance confirmés |
| ISSUE-010 | Connecter la conversation mobile au backend | Dépend du contrat API backend et des écrans |

Cet ordre est indicatif. Les dépendances réelles et les blocages priment sur le numéro. Si une issue est bloquée par un accès ou une décision non disponible, ne la contourne pas avec une implémentation supposée. Demande à la responsable si une autre issue indépendante peut être traitée entre-temps.

Ne crée pas de nouvelles issues ou fonctionnalités sans accord. Si le travail révèle un besoin supplémentaire, rédige une proposition d'issue et soumets-la à validation avant de commencer.

---

# 12. Démarrage de la mission — checklist

Avant le premier développement :

- [ ] Lire ce fichier intégralement.
- [ ] Lire le README, le périmètre produit, le PRD et le modèle d'issue.
- [ ] Vérifier l'accès au dépôt avec `gh auth status`.
- [ ] Récupérer localement la liste des issues ouvertes.
- [ ] Créer `.local/issues/` et vérifier qu'il est ignoré par Git.
- [ ] Vérifier l'état du dépôt et la branche principale.
- [ ] Vérifier la présence et la cohérence du `.gitignore`.
- [ ] Vérifier qu'aucun fichier `.env` ou secret n'est suivi par Git.
- [ ] Proposer la structure monorepo et les fichiers de configuration initiaux.
- [ ] Proposer les outils de lint, tests, hooks et sécurité.
- [ ] Présenter le plan d'initialisation à la responsable et attendre son accord avant les premières modifications distantes.

# 13. Format de compte rendu à chaque étape

À chaque point de contrôle, communiquer de façon concise :

```text
Issue : ISSUE-XXX — titre
Branche :
Objectif de l'étape :
Fichiers créés/modifiés :
Règles métier couvertes :
Use cases couverts :
Edge cases couverts :
Tests exécutés :
Résultats des tests :
Contrôles de sécurité :
Décisions prises et ADR mis à jour :
Points bloquants / questions :
Prochaine action proposée :
Validation attendue : (avant push / avant PR / revue PR)
```

Ne passe à l'étape suivante qu'après la validation correspondante.

---

# 14. Règle finale

La priorité est la fiabilité du produit, la sécurité et le respect des décisions métier — pas la vitesse d'écriture du code.

**En cas de doute : ne suppose pas, ne contourne pas, ne pousse pas. Documente le problème et demande l'avis de la responsable du projet.**

Aucun push, aucune ouverture de PR et aucun passage à l'issue suivante sans les validations prévues dans ce document.
