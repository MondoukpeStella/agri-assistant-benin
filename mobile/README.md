# Application mobile

Socle Android du MVP, en React Native et JavaScript, avec Expo SDK 58. Cet écran est technique : il confirme que l'application démarre. Il ne consulte pas de prix et n'affiche aucun montant.

La décision de structure est enregistrée dans [`docs/decisions/ADR-001-mobile-expo-foundation.md`](../docs/decisions/ADR-001-mobile-expo-foundation.md).

## Prérequis

- Node.js 22.13.0 ou plus récent. Cette initialisation a été vérifiée avec Node.js 22.22.1 et npm 9.2.0.
- npm.
- Un téléphone Android avec [Expo Go](https://expo.dev/go) pour la vérification sur appareil.
- Le téléphone et l'ordinateur sur le même réseau Wi-Fi pour le mode local.

Aucun SDK Android, émulateur ou backend n'est requis pour cet écran.

`mobile/.npmrc` active `engine-strict`. Une version de Node inférieure à 22.13 fait échouer `npm ci`.

## Installation

Depuis la racine du dépôt :

```bash
cd mobile
npm ci
```

Utiliser `npm ci` afin d'installer exactement les versions de `package-lock.json`. Ne pas supprimer le lockfile pour « réparer » une installation.

## Lancement

```bash
cd mobile
npm start
```

Expo affiche un QR code.

1. Ouvrir Expo Go sur le téléphone Android.
2. Scanner le QR code.
3. L'écran « Assistant agricole » s'affiche, avec le texte indiquant qu'aucun prix n'est consulté.

Le rechargement après une modification d'interface se fait dans le terminal Expo avec la touche `r`, ou par le menu de développement d'Expo Go.

## Variables d'environnement

Aucune variable n'est obligatoire. Sans fichier `.env`, l'écran affiche `Configuration : development`.

Pour nommer explicitement l'environnement local :

```bash
cp .env.example .env
```

`.env` est ignoré par Git. Seul `.env.example` est versionné. La valeur acceptée de `EXPO_PUBLIC_APP_ENV` est un nom court composé de lettres, de chiffres, de `_` ou de `-`. Toute autre valeur est ignorée et remplacée par `development`.

## Scripts

| Commande               | Rôle                                           |
| ---------------------- | ---------------------------------------------- |
| `npm start`            | Démarre le serveur Expo                        |
| `npm run android`      | Ouvre le serveur Expo en ciblant Android       |
| `npm test`             | Lance les tests une fois, sans mode interactif |
| `npm run lint`         | ESLint via `expo lint`                         |
| `npm run format`       | Formate les sources avec Prettier              |
| `npm run format:check` | Vérifie le formatage                           |

Les scripts `ios` et `web` viennent du modèle Expo. Le parcours de validation du MVP est Android.

## Structure

```text
mobile/
├── App.js
├── index.js
├── src/
│   ├── constants/
│   ├── navigation/
│   └── screens/
└── tests/
```

`RootNavigator` affiche directement l'écran technique. Aucune bibliothèque de navigation n'est installée. Les dossiers `components`, `services`, `storage`, `hooks` et `utils` seront ajoutés lorsqu'une issue en aura l'usage.

## Vérifications

```bash
cd mobile
npm ci
npm test
npm run lint
npm run format:check
npm audit --audit-level=high
```

## Problèmes courants

### Version de Node incompatible

`npm ci` s'arrête si Node est plus ancien que 22.13. Installer Node.js 22.13 ou plus récent, puis relancer `npm ci` dans `mobile/`.

### Dépendance ou lockfile incohérent

Relancer une installation propre :

```bash
cd mobile
rm -rf node_modules
npm ci
```

Ne pas utiliser `npm install` pour reconstruire un environnement déjà verrouillé, et ne pas effacer `package-lock.json`.

### Téléphone non détecté

Le serveur local n'a pas besoin d'un câble USB. Vérifier qu'Expo Go est installé et que le téléphone rejoint le même Wi-Fi que l'ordinateur.

Si le réseau bloque la découverte locale, relancer avec un tunnel :

```bash
npx expo start --tunnel
```

Le tunnel peut demander un compte Expo. Ce compte n'est pas un compte utilisateur de l'application.

### Port déjà utilisé

Le port par défaut est 8081. En choisir un autre :

```bash
npx expo start --port 8082
```

### Fichier `.env` absent

Le démarrage reste possible. L'écran affiche la configuration `development`.

### Secret ajouté par erreur

`.env`, les clés, les certificats et les bases locales sont ignorés. Avant un commit, le hook pre-commit et `scripts/check-sensitive-files.sh` refusent ces fichiers. Voir le README racine pour installer le hook.

## Limites connues

- La vérification sur téléphone Android est manuelle, avec Expo Go.
- `npm audit` signale 22 vulnérabilités modérées, toutes transitives, dans `minimatch` et `glob`, ramenées par Expo SDK 58 et Jest 30. Aucune alerte haute ou critique n'est présente au 22 novembre 2026. Le correctif proposé par npm rétrograde Expo vers SDK 52 : il n'est pas appliqué. Le détail est dans l'ADR-001.
- Le fichier `LICENSE` est la licence MIT du modèle Expo (copyright 650 Industries). La licence du produit n'est pas choisie dans cette issue.
- Aucun fournisseur vocal, aucune clé et aucun appel réseau métier ne sont inclus.
