# ADR-003 — Entrée mobile : langue, introduction et conversation

- Statut : accepté
- Date : 2026-11-22
- Issue / PR : ISSUE-004, GitHub #4. Pull request non ouverte.

## Contexte

Le socle Expo affichait un écran technique. Le premier parcours agriculteur choisit la langue, présente une introduction, puis ouvre une conversation sans consulter de prix tant que l'écran n'est pas relié au backend. La maquette de référence est le fichier Figma « Agri-Assistant Bénin — Maquettes MVP ».

## Options examinées

1. Conserver un navigateur interne, sans bibliothèque, et mémoriser uniquement la langue avec AsyncStorage.
2. Ajouter React Navigation et SQLite dès cet écran.
3. Rédiger maintenant les phrases fon affichées.

## Décision

Le navigateur interne suit la maquette : Démarrer, le choix de langue confirmé par Continuer, l'introduction, puis la conversation. Au lancement suivant, Démarrer rouvre le choix de langue avec la langue déjà mémorisée. Continuer ouvre alors la conversation. Le français propose la saisie, les suggestions et le micro de la barre, comme la maquette. Le fon n'affiche pas de texte : seulement le grand micro. Si l'enregistrement ne fournit rien, la page reste sans phrase de secours. Aucune phrase fon n'est affichée : l'introduction vocale reste marquée non validée tant qu'un locuteur natif ne l'a pas fournie. Le micro ouvre l'écran « Je vous écoute… » et n'envoie une demande qu'après une transcription fournie puis confirmée. L'en-tête ouvre Réglages. Cette page mène à l'historique ou au changement de langue, sans repasser par l'introduction. Les états de réponse, y compris un prix complet, sont affichés par des composants purs. L'application réelle ne leur fournit pas de prix. Le montant d'exemple de la maquette n'est pas repris.

L'enregistrement pendant sept jours est décidé dans l'ADR-006. Depuis Réglages, Historique des conversations ne liste que les messages déjà marqués comme historiques.

## Justification

React Navigation et SQLite ne sont pas nécessaires pour ce parcours. Inventer une orthographe fon présenterait un texte non vérifié comme une traduction. AsyncStorage suffit pour une préférence de langue non sensible.

## Conséquences

### Positives

- Le premier lancement et le retour sont testés pour les deux langues.
- Aucun montant n'apparaît sans montant, devise, unité, date et statut validé.
- Les composants de conversation ne connaissent pas l'URL du backend.

### Négatives

- Le bouton de démarrage fon affiche « OK », faute de libellé validé.
- Sans transcription fournie, l'arrêt du micro annonce que l'entrée vocale n'est pas disponible.
- Le bouton « Écouter la réponse » n'émet pas encore de son.
- La vérification clavier sur un petit téléphone Android reste manuelle.

## Alternatives rejetées

- Bibliothèque de navigation : dépendance supplémentaire pour trois étapes.
- SQLite maintenant : cela réaliserait l'issue 006 dans cette branche.
- Texte fon provisoire présenté comme définitif : contraire à la validation native exigée.
