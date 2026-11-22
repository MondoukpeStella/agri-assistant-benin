# Modèle de description des issues

Toute issue de développement doit être suffisamment précise pour être exécutée et vérifiée indépendamment.

## 1. Contexte

Décrire le besoin, le problème à résoudre, les utilisateurs concernés et le lien avec le périmètre du MVP.

## 2. Ce qu'il faut faire

Lister les actions concrètes et ordonnées. Préciser les fichiers, composants, endpoints ou écrans concernés lorsque c'est connu. Éviter les formulations vagues.

## 3. Ressources et contraintes

Indiquer :
- les dépendances techniques ou fonctionnelles ;
- la documentation et les ressources disponibles ;
- les prérequis et éventuels blocages ;
- les hypothèses à confirmer ;
- les limites de temps, de performance, de compatibilité ou de sécurité.

## 4. Règles

Énumérer les règles métier, validations, cas limites et comportements d'erreur à respecter.

## 5. Résultats attendus / Definition of Done

Décrire les livrables observables et les critères vérifiables permettant de considérer l'issue comme terminée.

## 6. Tests obligatoires

Lister les tests unitaires, d'intégration ou manuels à exécuter, avec les scénarios nominaux, les cas limites et les erreurs.

---

## Règles de rédaction des issues

- Une issue doit représenter une tâche réalisable et vérifiable.
- Découper les tâches trop larges en sous-tâches indépendantes.
- Ne pas inventer les contrats d'API : marquer comme bloqué tout travail qui dépend d'une documentation non reçue.
- Distinguer les données fictives de démonstration des données réelles.
- Décrire explicitement les cas d'échec et les comportements attendus.
- Ajouter des critères d'acceptation testables, pas seulement des intentions.
