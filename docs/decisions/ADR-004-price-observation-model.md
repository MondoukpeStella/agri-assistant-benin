# ADR-004 — Modèle interne d'une observation de prix

- Statut : accepté
- Date : 2026-11-22
- Issue / PR : ISSUE-005, GitHub #5. Pull request non ouverte.

## Contexte

Le backend doit pouvoir juger une observation de prix avant de répondre au mobile. Le contrat AgroFlux n'est pas documenté : l'issue 003 reste bloquée. Le modèle interne ne doit donc pas reprendre des noms de champs fournisseur.

## Options examinées

1. Un modèle interne, plus un contrat d'adaptateur aux jetons de l'application, sans client AgroFlux.
2. Modéliser dès maintenant les champs supposés de la réponse AgroFlux.
3. Attendre le contrat fournisseur avant tout modèle.

## Décision

`PriceObservation` porte l'identifiant interne, la source, l'identifiant source, le produit, le marché, le montant, la devise, l'unité, la date de collecte, la date de publication facultative, la date de récupération, le statut de validation et la variété facultative.

Les seuls produits acceptés sont `maize` et `rice`. Les seuls marchés acceptés sont `natitingou` et `savalou`. Toute autre valeur est rejetée, sans rapprochement silencieux. La variété absente n'empêche pas l'observation.

`map_supplier_record` reçoit un `SupplierPriceRecord`. Ses noms sont le contrat de l'adaptateur de cette application. Ils ne décrivent pas AgroFlux. L'adaptateur futur devra traduire la réponse fournisseur vers ces jetons.

Un montant nul, négatif, non numérique ou trop précis est rejeté. Pour `XOF`, seule une valeur entière positive est acceptée, conformément à l'exposant zéro de l'ISO 4217. Au-delà de deux décimales, le montant est rejeté pour toute devise. Aucune conversion d'unité n'existe : `sac` reste `sac`.

La date de collecte est une date, distincte de la date de publication et de la date de récupération. Une date absente ou mal formée rejette l'observation. Elle n'est jamais remplacée par la date de récupération. Une date de collecte future est conservée et n'est pas affichable.

Une observation non validée, annulée ou au statut inconnu peut être conservée, mais `assess_display` la marque non affichable. Une devise absente, inconnue, ou une unité vide a le même effet. `FCFA` n'est pas traduit en `XOF`.

La fraîcheur provisoire est calculée en jours entiers depuis la date de collecte : 0 à 2 jours `fresh`, 3 à 5 jours `aging`, au-delà `stale`. Une observation `stale` reste affichable. Masquer un prix ancien n'est pas décidé.

Deux observations avec la même source et le même identifiant source n'en conservent qu'une : celle dont `retrieved_at` est la plus récente. À horodatage égal, la première déjà retenue reste. Répéter la déduplication ne change pas le résultat.

Aucun endpoint HTTP et aucune table PostgreSQL ne sont ajoutés.

## Justification

Attendre AgroFlux bloquerait le modèle métier alors que les règles déjà écrites suffisent à valider un prix. Inventer les champs du fournisseur créerait un couplage faux. Séparer l'éligibilité à l'affichage de la fraîcheur évite de trancher, sans décision, le sort d'un prix de plus de cinq jours.

## Conséquences

### Positives

- Les tests couvrent l'observation valide, les rejets, l'inéligibilité et le doublon.
- Le mobile ne reçoit toujours aucun prix par cette issue.
- L'adaptateur fournisseur pourra changer sans renommer le modèle interne.

### Négatives

- Le contrat d'adaptateur devra être révisé si les jetons internes se révèlent insuffisants.
- La politique d'affichage d'un prix `stale` reste ouverte.
- `XOF` est la seule devise reconnue pour l'affichage.

## Alternatives rejetées

- Champs AgroFlux supposés : contraire à l'issue 003.
- Aucun modèle avant le contrat : retarderait les issues 007 et 009 sans réduire le risque.
