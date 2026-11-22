# Modèle de description des issues

Toute issue doit être suffisamment précise pour être exécutée et vérifiée indépendamment. Une personne qui découvre le projet doit pouvoir comprendre le besoin, le comportement attendu et la manière de vérifier le résultat sans devoir deviner les règles métier.

## Convention de numérotation

- Utiliser un identifiant stable dans le titre : `[ISSUE-001]`, `[ISSUE-002]`, etc.
- Conserver le numéro natif GitHub dans l'URL et dans le suivi des issues.
- Ne pas réutiliser un identifiant déjà attribué, même si une issue est fermée.
- Ajouter ensuite un ou plusieurs tags de domaine : `[MOBILE]`, `[BACKEND]`, `[DATA]`, `[VOICE]`, `[SETUP]`, `[QA]`, etc.

## 1. Contexte et objectif

Décrire :
- le problème ou besoin à résoudre ;
- les utilisateurs concernés ;
- la valeur attendue ;
- le périmètre concerné dans le MVP ;
- les dépendances vers d'autres issues ;
- ce qui est explicitement hors périmètre.

## 2. Travail à réaliser

Lister les actions concrètes, ordonnées et vérifiables.
Préciser les composants, fichiers, écrans, endpoints, schémas ou services concernés lorsque c'est connu.
Séparer les tâches obligatoires des améliorations facultatives.
Ne pas transformer une hypothèse en exigence sans la signaler.

## 3. Ressources, dépendances et contraintes

Indiquer :
- les dépendances techniques et fonctionnelles ;
- la documentation et les ressources disponibles ;
- les prérequis et éventuels blocages ;
- les hypothèses à confirmer et la personne/source qui doit les confirmer ;
- les contraintes de compatibilité, performance, sécurité, réseau, coût ou délai.

## 4. Règles métier et règles techniques

Énumérer précisément :
- les données autorisées et interdites ;
- les validations à appliquer ;
- les conditions qui autorisent ou interdisent une action ;
- les règles de sélection, de calcul, de conservation ou d'affichage ;
- les réponses attendues en cas d'information manquante ;
- les comportements en cas d'erreur ;
- les règles de sécurité et de confidentialité.

Pour chaque règle, préciser si elle est confirmée, provisoire ou à valider. Ne jamais inventer une règle fournisseur ou une donnée métier.

## 5. Use cases (cas d'utilisation)

Décrire les parcours concrets qui doivent fonctionner. Utiliser ce format :

### UC-01 — [Nom du scénario]
- **Acteur :**
- **Préconditions :**
- **Déclencheur :**
- **Parcours nominal :**
  1. …
  2. …
  3. …
- **Résultat attendu :**
- **Règles métier sollicitées :**

Ajouter les variantes utiles : parcours incomplet, information manquante, utilisateur qui annule, reprise après erreur, etc. Ne pas se limiter à un seul cas nominal.

## 6. Edge cases (cas limites et situations anormales)

Lister les situations inhabituelles ou problématiques et le comportement attendu pour chacune :
- données absentes, nulles, invalides, incohérentes ou dupliquées ;
- valeurs aux limites (minimum, maximum, date limite, taille maximale) ;
- réseau lent, coupé ou rétabli ;
- service tiers indisponible, délai dépassé ou quota atteint ;
- double clic, requête répétée ou réponse tardive ;
- fermeture, redémarrage ou interruption en cours de traitement ;
- permissions, stockage ou configuration manquants.

Format recommandé :
- **Situation :**
- **Comportement attendu :**
- **Comportement interdit :**

## 7. Résultats attendus et critères d'acceptation

Décrire les livrables observables et les conditions vérifiables permettant de considérer l'issue comme terminée.
Utiliser des critères cochables et non ambigus :

- [ ] …
- [ ] …
- [ ] …

Préciser ce qui doit être visible dans l'interface, présent dans l'API, documenté ou persisté. Une intention comme « gérer les erreurs » n'est pas un critère suffisant : indiquer quelles erreurs et quelle réponse est attendue.

## 8. Tests obligatoires

Lister les tests unitaires, d'intégration et manuels nécessaires :
- scénario nominal ;
- variantes de use cases ;
- chaque edge case identifié ;
- validations positives et négatives ;
- erreurs réseau et erreurs de dépendances ;
- non-régression sur les règles métier ;
- vérifications de sécurité pertinentes.

Pour chaque test important, préciser les données d'entrée et le résultat attendu. Les tests doivent être reproductibles et ne pas dépendre de données réelles non maîtrisées.

## 9. Définition of Done

Une issue ne peut être fermée que lorsque :
- les critères d'acceptation sont satisfaits ;
- les tests obligatoires passent ;
- les cas limites prioritaires sont traités ;
- le code est relu et suffisamment documenté ;
- aucun secret ou donnée sensible n'a été ajouté au dépôt ;
- les limites connues et décisions restant à prendre sont consignées.

---

## Règles générales de rédaction

- Une issue représente un objectif de travail clair et vérifiable.
- Découper les tâches trop larges en sous-issues indépendantes, liées à l'issue parente.
- Ne pas inventer les contrats d'API : bloquer les travaux qui dépendent d'une documentation non reçue.
- Distinguer strictement les données fictives de démonstration des données réelles.
- Séparer les règles confirmées, provisoires et à décider.
- Décrire explicitement les cas d'échec et les comportements attendus.
- Ajouter des critères d'acceptation testables, pas seulement des intentions.
- Ne pas ajouter une fonctionnalité hors MVP sans décision explicite.
