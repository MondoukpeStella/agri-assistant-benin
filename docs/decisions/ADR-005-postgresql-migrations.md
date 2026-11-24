# ADR-005 — PostgreSQL et migrations

- Statut : accepté
- Date : 2026-11-24
- Issue / PR : ISSUE-009, GitHub #9.

## Contexte

Le backend doit pouvoir se connecter à PostgreSQL et faire évoluer un schéma versionné. Le processus HTTP doit rester utilisable lorsque la base est absente. Aucune table métier n'est encore justifiée : les comptes sont hors MVP, et l'historique des prix n'a pas de décision de persistance.

## Options examinées

1. SQLAlchemy 2 et Alembic, avec le pilote psycopg 3.
2. SQLAlchemy et un outil de migration séparé, tel que yoyo-migrations.
3. Créer dès maintenant une table d'observations de prix.

## Décision

PostgreSQL 16 démarre avec Docker Compose. `DATABASE_URL` est optionnelle pour le processus. `GET /health` reste un contrôle du processus. `GET /database/status` vérifie la connexion et répond 503 lorsqu'elle échoue, sans recopier l'URL. Alembic est l'outil de migration. La première révision ne crée aucune table métier. Le développement utilise la base `agri_dev`. Les tests et les migrations lancés avec `APP_ENV=test` n'acceptent que `agri_test`.

## Justification

SQLAlchemy et Alembic sont le couple habituel de FastAPI, et psycopg 3 est le pilote PostgreSQL maintenu pour Python 3.12. Séparer le contrôle de la base de `/health` conserve le contrat déjà testé. Refuser `agri_dev` lorsque `APP_ENV=test` empêche un test de modifier la base de développement. Une table de prix maintenant figerait une décision qui n'est pas prise.

## Conséquences

### Positives

- La base locale se crée, se migre, se sauvegarde et se réinitialise par des commandes documentées.
- Une migration déjà appliquée ne crée pas de doublon.
- Les tests d'intégration utilisent une base dédiée en intégration continue.

### Négatives

- Sans `DATABASE_URL`, les migrations refusent de démarrer.
- Le schéma métier reste à écrire lorsqu'une persistance sera décidée.

## Alternatives rejetées

- Table d'observations dès cette issue : l'ADR-004 décrit le modèle, pas son stockage.
- Contrôle PostgreSQL dans `GET /health` : cette route annoncerait une dépendance qui peut être arrêtée.
