# Périmètre produit — MVP

## 1. Problème et objectif

Les agriculteurs peuvent manquer d'informations fiables et récentes sur les prix pratiqués sur certains marchés. Le MVP doit leur permettre de consulter simplement un prix validé du maïs ou du riz.

## 2. Utilisateurs et canaux

- Utilisateurs ciblés : agriculteurs uniquement.
- Canal MVP : application mobile Android.
- Canaux ultérieurs possibles : WhatsApp et appels téléphoniques/IVR. Ils ne font pas partie du MVP.

## 3. Couverture

| Élément | Couverture MVP |
|---|---|
| Produits | Maïs, riz |
| Marchés | Natitingou (Atacora), Savalou (Collines) |
| Langues | Français et fon |
| Français | Texte et voix |
| Fon | Voix uniquement |

Si le marché demandé n'est pas couvert, l'assistant l'explique et propose Natitingou ou Savalou.

## 4. Parcours principal

1. Au premier lancement, l'utilisateur choisit manuellement la langue.
2. Une courte introduction est présentée dans la langue choisie.
3. L'utilisateur accède à l'écran de conversation.
4. Il formule une demande de prix par texte ou par voix.
5. Si le produit ou le marché manque ou est ambigu, l'assistant pose uniquement la question nécessaire.
6. Le backend recherche une observation répondant aux règles de validation et de fraîcheur.
7. L'application affiche un seul prix, son unité et sa date de collecte, ou explique pourquoi aucun prix ne peut être fourni.

## 5. Règles métier et de réponse

- L'assistant est spécialisé dans la consultation des prix du maïs et du riz.
- Les demandes hors sujet sont poliment redirigées.
- Une demande claire reçoit directement une réponse, sans question superflue.
- Une demande ambiguë déclenche une clarification ciblée.
- Un seul prix est affiché par réponse.
- Aucun prix ne doit être inventé, extrapolé ou calculé sans règle métier explicitement validée.
- Seules les données validées par la source sont éligibles.
- Si aucune donnée validée n'est disponible, l'assistant le dit explicitement.
- Si l'API est indisponible, l'application affiche une erreur et propose « Réessayer ». Un ancien prix ne doit pas être présenté comme actuel.
- Aucun compte, mot de passe, OTP ou profil utilisateur dans le MVP.

## 6. Source de données et points à confirmer

La source envisagée est l'API AgroFlux Bénin. L'accès, la documentation et les modalités d'utilisation doivent encore être confirmés.

Avant l'intégration, vérifier :
- la disponibilité des données pour le maïs et le riz à Natitingou et Savalou ;
- les champs disponibles : prix, unité, marché, produit, variété/qualité éventuelle, date de collecte, statut de validation et identifiant d'observation ;
- la définition exacte d'une donnée validée ;
- la règle de sélection du prix à afficher (prix officiel de référence s'il existe, sinon règle convenue avec le fournisseur) ;
- les unités réellement fournies et les éventuelles équivalences documentées ;
- l'authentification, les quotas, les coûts, la disponibilité et les limites de l'API.

Ne jamais supposer le poids d'un sac ou d'une bassine et ne jamais convertir une unité sans équivalence fiable fournie ou validée.

## 7. Fraîcheur des données — politique provisoire

- 0 à 2 jours : affichage normal.
- 3 à 5 jours : affichage avec avertissement sur l'ancienneté.
- Plus de 5 jours : avertissement fort ou absence de prix, selon la règle finale à valider.

Cette politique est provisoire et doit être confirmée avec les contraintes réelles de collecte et la source.

## 8. Voix et langues

### Français
- Entrée texte et vocale.
- Réponse affichée en français et, en mode vocal, lue à haute voix.

### Fon
- Entrée et sortie vocales uniquement ; pas de texte en fon.
- Chaîne prévue : audio fon → reconnaissance vocale et traduction vers le français → extraction du produit et du marché → recherche backend → réponse française → traduction vers le fon → synthèse vocale fon.
- En cas de transcription incertaine, demander une confirmation courte.
- La faisabilité et la qualité STT/TTS en fon constituent un risque technique majeur à tester tôt avec des locuteurs natifs.
- Les fournisseurs STT, traduction et TTS restent à sélectionner.

## 9. Connexion et historique

- Aucune nouvelle consultation de prix hors connexion.
- L'historique des conversations reste consultable localement pendant 7 jours.
- L'historique n'est pas un catalogue de prix historiques et ne doit pas laisser croire qu'un prix ancien est actuel.
- La gestion détaillée de la conservation des fichiers audio reste à définir.

## 10. Architecture technique retenue

| Composant | Technologie |
|---|---|
| Application Android | React Native, JavaScript, Expo recommandé |
| Backend | Python, FastAPI |
| Base centrale | PostgreSQL |
| Historique local | SQLite |
| Communication | API REST |
| Déploiement | Docker |

## 11. Hors périmètre

- WhatsApp et IVR/appels téléphoniques.
- Autres produits ou marchés.
- Comparaison avec le prix proposé par un acheteur.
- Conseil de vendre, d'attendre ou de négocier.
- Évolution des prix, graphiques, tendances et notifications.
- Comptes et profils.
- Interfaces commerçants, agents ou administrateurs.
- Tests terrain dans le périmètre de développement initial ; à planifier séparément.

## 12. Principes d'implémentation

- Ne pas coder de comportement dépendant d'un champ API non confirmé.
- Isoler l'accès à AgroFlux derrière un service/adaptateur pour faciliter les tests et un éventuel changement de fournisseur.
- Utiliser des données fictives uniquement en développement et les identifier clairement comme telles.
- Ne jamais exposer de données fictives comme des prix réels.
- Documenter les décisions encore ouvertes et les hypothèses dans les issues concernées.
