# Assistant agricole conversationnel

Application mobile Android destinée aux agriculteurs béninois. Elle permet de consulter des prix validés du maïs et du riz sur les marchés de Natitingou et de Savalou, en français et en fon.

## Objectif du MVP

Réduire le manque d'information sur les prix agricoles en donnant accès à une information récente, compréhensible et issue d'une source de données validée.

## Périmètre fonctionnel

- Utilisateurs : agriculteurs.
- Produits : maïs et riz.
- Marchés : Natitingou (Atacora) et Savalou (Collines).
- Langues : français (texte et voix) et fon (voix uniquement).
- Consultation des prix par conversation textuelle ou vocale.
- Affichage d'un seul prix par réponse, avec son unité et sa date de collecte.
- Historique local des conversations disponible pendant 7 jours.

## Hors périmètre du MVP

- WhatsApp et appels téléphoniques/IVR.
- Comptes utilisateurs et authentification.
- Comparaison avec une offre d'acheteur, recommandations de vente ou d'attente.
- Tendances, graphiques, notifications et catalogue de prix historiques.
- Interface dédiée aux commerçants, agents de terrain ou coopératives.

## Stack technique retenue

- Application mobile : React Native avec JavaScript (Expo recommandé).
- Backend : Python et FastAPI.
- Base centrale : PostgreSQL.
- Historique local : SQLite.
- API : REST.
- Déploiement : Docker.

## Règles essentielles

- N'afficher que des observations validées provenant de la source de données retenue.
- Ne jamais inventer, extrapoler ou calculer un prix en l'absence de règle validée.
- Si aucune donnée validée n'est disponible, l'indiquer clairement.
- Si l'API est indisponible, afficher une erreur et proposer une nouvelle tentative ; ne pas présenter un ancien prix comme actuel.
- Hors des deux marchés couverts, expliquer la limite et proposer Natitingou ou Savalou.
- Hors du sujet des prix du maïs et du riz, rediriger poliment la conversation.
- Aucune nouvelle consultation de prix hors connexion ; seul l'historique local reste consultable.

## Documentation

- [Périmètre produit et décisions du MVP](docs/PRODUCT_SCOPE.md)
- [Modèle de description des issues](docs/ISSUE_TEMPLATE.md)

## État du projet

Le cadrage fonctionnel du MVP est défini. L'accès à l'API AgroFlux Bénin et la confirmation de ses modalités de données restent des prérequis à l'intégration réelle. Les détails techniques dépendant de cette API devront être confirmés avant implémentation.
