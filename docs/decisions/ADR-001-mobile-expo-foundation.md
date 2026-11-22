# ADR-001 — Socle mobile Expo en JavaScript

- Statut : accepté
- Date : 2026-11-22
- Issue / PR : ISSUE-001, GitHub #1. Pull request non ouverte.

## Contexte

Le MVP a besoin d'une application Android capable de démarrer avant le backend, les écrans métier et la chaîne vocale. Le dépôt ne contenait encore aucun code applicatif. La langage imposé est JavaScript, l'environnement imposé est Expo, et aucune bibliothèque ne doit être ajoutée sans besoin identifié.

## Options examinées

1. Expo SDK 58, modèle `blank`, JavaScript.
2. Expo SDK 58, modèle `default`, qui inclut TypeScript et Expo Router.
3. React Native CLI sans Expo.
4. Une version Expo plus ancienne afin de réduire les alertes transitives de `npm audit`.

## Décision

Initialiser `mobile/` avec Expo SDK 58.0 (`expo` ~58.0.26), React Native 0.88.1 et React 19.3.0, à partir du modèle JavaScript `blank`. Node.js 22.13 ou plus récent est requis. Le point d'entrée reste `index.js` et `App.js`. L'interface de démarrage vit dans `src/screens`, derrière `src/navigation/RootNavigator.js`, sans bibliothèque de navigation.

Aucune variable d'environnement n'est obligatoire. `EXPO_PUBLIC_APP_ENV` est optionnelle, limitée à un nom court, et vaut `development` lorsqu'elle est absente ou invalide.

## Justification

SDK 58 est la version stable publiée le 15 octobre 2026. Le modèle `blank` respecte l'interdiction de TypeScript et n'ajoute pas d'écran métier. La machine de développement dispose déjà de Node.js 22.22.1, compatible avec l'exigence 22.13. Reporter la navigation, le stockage et les services évite des dossiers vides et des dépendances inutilisées. Les dossiers `components`, `services`, `storage`, `hooks` et `utils` seront créés par l'issue qui en aura besoin.

## Conséquences

### Positives

- L'application démarre sans backend et sans prix.
- Les versions sont verrouillées par `package-lock.json`.
- Jest, React Native Testing Library, ESLint et Prettier sont alignés sur SDK 58.
- `babel-preset-expo` est une dépendance de développement explicite, car Jest doit le résoudre depuis la racine du projet mobile.
- Le vérificateur de secrets et la CI mobile sont en place avant le premier commit applicatif.

### Négatives

- Le contrôle sur un téléphone Android avec Expo Go reste manuel.
- `npm audit` signale 22 vulnérabilités modérées, transitives, via `minimatch` et `glob` dans Expo et Jest 30. Aucune alerte haute ou critique. Le correctif proposé par npm rétrograde Expo vers SDK 52 et Jest vers 29, ce qui casse le socle retenu. Ces alertes sont donc conservées et documentées.
- Les scripts `ios` et `web` du modèle Expo restent présents. Ils ne font pas partie du périmètre de validation du MVP.

## Alternatives rejetées

- TypeScript et Expo Router : hors du cadrage de l'initialisation.
- React Native CLI : plus de configuration native pour le même socle.
- Rétrograder Expo pour faire taire `npm audit` : incompatible avec le choix d'un SDK actuel et supporté.
