# ADR-002 — Socle backend FastAPI

- Statut : accepté
- Date : 2026-11-22
- Issue / PR : ISSUE-002, GitHub #2. Pull request non ouverte.

## Contexte

Le mobile ne doit ni choisir ni calculer un prix. Le backend doit devenir l'autorité métier, tout en restant démarrable et testable avant la réception du contrat AgroFlux et avant l'installation de PostgreSQL.

## Options examinées

1. FastAPI, configuration par pydantic-settings, verrouillage avec uv, Python 3.12.
2. FastAPI avec pip-tools et un `requirements.txt` verrouillé.
3. Inclure dès maintenant un client AgroFlux ou un contrôle PostgreSQL dans `/health`.

## Décision

Créer `backend/` comme application FastAPI non empaquetée. Python est fixé à 3.12. uv 0.13.1 produit `uv.lock` et l'environnement virtuel. `APP_ENV` est obligatoire. `LOG_LEVEL` vaut `INFO` lorsqu'elle est absente. `GET /health` rapporte uniquement que le processus répond. Les erreurs de validation et les exceptions internes deviennent des réponses JSON stables, sans répéter le contenu reçu ni la trace interne.

La route `POST /api/v1/probe` existe pour exercer la validation HTTP. Elle ne représente pas une consultation de prix. L'adaptateur AgroFlux et PostgreSQL restent hors de cette issue.

## Justification

La stack est imposée. uv est déjà disponible sur la machine de développement et fournit un verrou reproductible. Python 3.12 est retenu plutôt que le Python 3.14 du système afin de rester sur une version explicitement supportée par l'ensemble des dépendances résolues. Un health check sans base évite d'annoncer une dépendance qui n'est pas encore configurée.

## Conséquences

### Positives

- L'API démarre sans clé fournisseur et sans PostgreSQL.
- Les tests couvrent la configuration, `/health`, le JSON invalide et l'exception interne.
- La CI backend exécute Ruff, pytest, Bandit et pip-audit.

### Négatives

- La documentation interactive reste ouverte hors production.
- Les seuils de limitation de débit ne sont pas définis, donc aucune limite n'est appliquée.
- Un développeur qui lance Python 3.14 directement, sans uv, sort du socle verrouillé.

## Alternatives rejetées

- pip-tools : fonctionnel, mais uv est déjà présent et couvre l'environnement virtuel et le verrou.
- Contrôle PostgreSQL dans `/health` : il ferait croire que la base est requise et opérationnelle.
- Client AgroFlux fictif : le contrat réel n'est pas connu.
