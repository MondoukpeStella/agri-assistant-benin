# ADR-006 — Historique local des conversations pendant 7 jours

- Statut : accepté
- Date : 2026-11-22
- Issue / PR : ISSUE-006, GitHub #6. Pull request non ouverte.

## Contexte

Le parcours de conversation existe déjà. L'agriculteur doit pouvoir relire les échanges récents sans réseau, pendant 7 jours, sans que cet historique devienne un catalogue de prix et sans lancer une nouvelle consultation hors ligne. L'issue 003 reste ouverte : aucun accès AgroFlux réel n'est inventé ici.

## Options examinées

1. SQLite sur l'appareil, avec le même SQL testé en mémoire.
2. AsyncStorage pour tout l'historique.
3. Effacer le fichier dès qu'une migration échoue.

## Décision

L'application enregistre les conversations dans SQLite (`expo-sqlite`, fichier `agri-history.db`). Le schéma est en version 1 : une conversation et ses messages. Chaque message conserve le rôle, le texte, la langue (`fr` ou `fon`), l'horodatage ISO-8601 UTC et le statut (`question`, `price`, `clarification`, `unavailable`, `marketUncovered`, `noValidatedData`). Un prix n'est écrit que s'il est affichable. Une erreur réseau, un refus hors connexion et un statut inconnu ne sont pas écrits.

La version 0 crée les tables et passe en version 1. La version 1 ne change rien. Une version plus récente bloque la lecture et l'écriture, sans supprimer le fichier. Une écriture interrompue est annulée par une transaction ; un message encore `finalized = 0` n'est pas affiché. À l'ouverture, les messages dont l'horodatage est lisible et antérieur ou égal à exactement 7 jours sont supprimés. Un horodatage illisible est conservé. L'horloge comparée est celle du téléphone au moment de l'ouverture : une horloge avancée peut effacer trop tôt, une horloge retardée conserve plus longtemps.

Les messages rechargés sont marqués historiques. Aucun fichier audio ni secret n'est stocké. Une base absente, après réinstallation, s'ouvre vide.

## Justification

SQLite garde l'historique lisible hors ligne et permet une purge datée. Tester le SQL avec le module SQLite de Node évite d'exiger le module natif dans Jest. Refuser d'effacer une base à schéma inconnu évite de détruire des conversations que l'application ne sait plus lire.

## Conséquences

### Positives

- Une consultation réussie est relue après fermeture, avec une date historique.
- L'historique reste consultable quand une nouvelle demande est refusée faute de connexion.
- Le plein disque et une migration inconnue laissent l'écran de conversation ouvert.

### Négatives

- La purge dépend de l'horloge de l'appareil.
- Tant que l'écran n'est pas relié au backend, la demande courante n'est pas archivée : elle n'a pas de réponse de prix à conserver.

## Alternatives rejetées

- AsyncStorage : suffisant pour la langue, mal adapté à une purge et à une écriture transactionnelle.
- Recréer la base si la migration échoue : cela effacerait des conversations encore présentes.
