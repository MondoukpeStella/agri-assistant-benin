# ADR-003 — Entrée mobile : langue, introduction et conversation

- Statut : accepté
- Date : 2026-11-22
- Issue / PR : ISSUE-004, GitHub #4. Pull request non ouverte.

## Contexte

Le socle Expo affichait un écran technique. Le premier parcours agriculteur choisit la langue, présente une introduction, puis ouvre une conversation sans consulter de prix tant que l'écran n'est pas relié au backend.

## Options examinées

1. Conserver un navigateur interne, sans bibliothèque, et mémoriser uniquement la langue avec AsyncStorage.
2. Ajouter React Navigation et SQLite dès cet écran.
3. Rédiger maintenant les phrases fon affichées.

## Décision

Le navigateur interne passe de la langue à l'introduction, puis à la conversation. Au lancement suivant, une langue `fr` ou `fon` mémorisée ouvre directement la conversation. Le français propose la saisie et les suggestions. Le fon masque le champ de texte. Aucune phrase fon n'est affichée : l'introduction vocale reste marquée non validée tant qu'un locuteur natif ne l'a pas fournie. L'entrée vocale ne fabrique pas de transcription. Les états de réponse, y compris un prix complet, sont affichés par des composants purs. L'application réelle ne leur fournit pas de prix.

L'historique de sept jours reste l'objet de l'issue 006. Cet écran sait seulement distinguer visuellement un message marqué historique.

## Justification

React Navigation et SQLite ne sont pas nécessaires pour ce parcours. Inventer une orthographe fon présenterait un texte non vérifié comme une traduction. AsyncStorage suffit pour une préférence de langue non sensible.

## Conséquences

### Positives

- Le premier lancement et le retour sont testés pour les deux langues.
- Aucun montant n'apparaît sans montant, devise, unité, date et statut validé.
- Les composants de conversation ne connaissent pas l'URL du backend.

### Négatives

- Le bouton de démarrage fon affiche « OK », faute de libellé validé.
- Le bouton vocal annonce que l'entrée n'est pas disponible.
- La vérification clavier sur un petit téléphone Android reste manuelle.

## Alternatives rejetées

- Bibliothèque de navigation : dépendance supplémentaire pour trois étapes.
- SQLite maintenant : cela réaliserait l'issue 006 dans cette branche.
- Texte fon provisoire présenté comme définitif : contraire à la validation native exigée.
