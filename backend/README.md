# Backend

API FastAPI du MVP. Elle sera l'autorité pour les règles métier et la consultation des prix. Ce socle expose un contrôle de santé du processus et une route technique de validation. Il n'appelle pas AgroFlux et ne retourne aucun prix.

La décision est enregistrée dans [`docs/decisions/ADR-002-backend-foundation.md`](../docs/decisions/ADR-002-backend-foundation.md).

## Prérequis

- Python 3.12. Le fichier `.python-version` fixe cette version.
- [uv](https://docs.astral.sh/uv/) 0.13.1, utilisé pour l'environnement virtuel et le fichier verrouillé `uv.lock`.

## Installation

Depuis la racine du dépôt :

```bash
cd backend
uv sync --frozen --all-groups
```

`uv sync --frozen` installe exactement les versions de `uv.lock`.

## Configuration

Copier l'exemple puis ajuster les valeurs locales :

```bash
cp .env.example .env
```

`.env` reste sur la machine. Seul `.env.example` est versionné.

| Variable | Obligatoire | Défaut | Valeurs |
|---|---|---|---|
| `APP_ENV` | oui | aucun | `development`, `test`, `production` |
| `LOG_LEVEL` | non | `INFO` | `DEBUG`, `INFO`, `WARNING`, `ERROR` |
| `CORS_ORIGINS` | non | vide | origines explicites séparées par des virgules |
| `DATABASE_URL` | non pour le processus | vide | URL `postgresql+psycopg://` |
| `POSTGRES_USER` | pour Docker | aucune | utilisateur local |
| `POSTGRES_PASSWORD` | pour Docker | aucune | mot de passe local, jamais commité |
| `POSTGRES_DB` | pour Docker | aucune | `agri_dev` en développement |
| `FRENCH_LLM` | non | `off` | `off`, `qwen` |

Si `APP_ENV` est absente ou invalide, le processus s'arrête avant d'écouter. Le message cite le nom du paramètre et ne répète pas la valeur reçue. Une origine CORS `*` est refusée.

`DATABASE_URL` peut rester vide : l'API démarre, `GET /health` répond, et `GET /database/status` répond 503. En `development`, l'URL doit viser la base `agri_dev`. En `test`, elle doit viser `agri_test`. En `production`, ces deux noms sont refusés. Le message d'erreur ne répète pas l'URL.

## Lancement

```bash
cd backend
uv run uvicorn app.main:create_app --factory --host 127.0.0.1 --port 8000
```

Vérifier le processus :

```bash
curl http://127.0.0.1:8000/health
```

La réponse attendue est `{"status":"ok"}`. Elle indique que le processus répond. Elle ne contrôle pas PostgreSQL et ne contient aucun prix.

## PostgreSQL

La décision est dans [`docs/decisions/ADR-005-postgresql-migrations.md`](../docs/decisions/ADR-005-postgresql-migrations.md). SQLAlchemy 2 et Alembic gèrent la connexion et les migrations. psycopg 3 est le pilote. Aucune table métier n'est créée : les comptes sont hors MVP, et la persistance des prix n'est pas décidée.

Démarrer la base locale, puis appliquer les migrations :

```bash
cd backend
cp .env.example .env
docker compose up -d
uv run alembic upgrade head
```

Remplacer `change-me` dans `.env` avant le premier démarrage. Le script d'initialisation crée `agri_dev` et `agri_test` si elles manquent. `agri_test` est réservée aux tests.

Vérifier la connexion, séparément du processus :

```bash
curl http://127.0.0.1:8000/database/status
```

`{"status":"ok"}` signifie que PostgreSQL a répondu. `{"status":"unavailable"}` avec le code 503 signifie que l'URL est vide, que le conteneur est arrêté, ou que l'identifiant est refusé. Le journal dit `Connexion PostgreSQL impossible.` sans l'URL.

Appliquer une migration déjà présente ne crée pas de seconde ligne dans `alembic_version`. Une migration qui échoue laisse le schéma à la révision précédente.

Sauvegarder la base de développement :

```bash
docker compose exec postgres pg_dump -U "$POSTGRES_USER" agri_dev > backup.sql
```

Réinitialiser les données locales, puis recréer le schéma :

```bash
docker compose down -v
docker compose up -d
uv run alembic upgrade head
```

Si le port 5432 est déjà pris, arrêter l'autre PostgreSQL ou changer le port publié dans `docker-compose.yml` et dans `DATABASE_URL`.

Les tests qui migrent une base lisent `DATABASE_URL`. Sans cette variable, ils sont ignorés. Ils refusent toute base autre que `agri_test`. L'intégration continue fournit cette base et ne touche pas `agri_dev`.

La documentation interactive est disponible en `development` et `test` sur `/docs`. Elle est désactivée lorsque `APP_ENV=production`.

`POST /api/v1/probe` accepte un objet JSON `{"message":"..."}` afin de vérifier la validation des requêtes. Cette route ne consulte pas de prix.

## Voix française

`POST /api/v1/voice/french` accepte `{"text":"..."}` ou `{"audio_base64":"..."}`. La réponse contient `status`, `transcript`, `reply`, et éventuellement `product` et `market`. Elle ne contient pas de montant.

La lecture des mots se fait d'abord par des règles fixes : maïs, riz, Natitingou, Savalou. Le soja et Parakou reçoivent une phrase hors périmètre. Tant qu'aucune observation validée n'est fournie au composeur, une question comprise se répond par « Je ne dispose pas actuellement d'un prix validé. »

`FRENCH_LLM=qwen` charge localement `Qwen/Qwen2.5-0.5B-Instruct` (Apache 2.0) avec `transformers`. Le modèle ne peut renvoyer que les jetons `maize`, `rice`, `natitingou` et `savalou`. Un montant ou une devise dans sa sortie est ignoré. La valeur par défaut est `off`, donc l'installation habituelle ne télécharge aucun poids.

La reconnaissance audio utilise `faster-whisper` (MIT), langue forcée `fr`, taille `small`. `transformers` et `faster-whisper` ne sont pas dans les dépendances verrouillées : s'ils sont absents, l'audio répond que la reconnaissance n'est pas disponible, sans prix. La synthèse sur le téléphone utilise la voix française de l'appareil. Piper (`fr_FR-siwis-medium`, CC-BY 4.0, moteur GPL-3.0) n'est pas intégré.

## Observation de prix

Le modèle interne vit dans `app/domain/price_observation.py`. `app/services/supplier_mapping.py` traduit un enregistrement déjà exprimé dans les jetons de l'application (`maize`, `rice`, `natitingou`, `savalou`). Ces jetons ne sont pas les champs AgroFlux. Cette route n'appelle pas AgroFlux.

`GET /api/v1/prices/wfp?product=maize&market=natitingou` lit l'extrait WFP versionné dans `data/wfp/`. La source est le jeu HDX [Benin - Food Prices](https://data.humdata.org/dataset/wfp-food-prices-for-benin), licence CC BY-IGO, fichier mis à jour le 15 novembre 2026. L'extrait conserve le maïs et le riz pour Natitingou et Savalou. Chaque montant est recopié, avec sa date de collecte, son unité et le nom de la denrée publiée (`Maize (white)`, `Rice (imported)`, etc.). `current` vaut `false` : une observation mensuelle n'est pas le prix du jour. La décision sur le modèle d'observation est dans [`docs/decisions/ADR-004-price-observation-model.md`](../docs/decisions/ADR-004-price-observation-model.md).

## Vérifications

```bash
cd backend
uv run ruff check .
uv run ruff format --check .
uv run pytest
uv run bandit -r app -q
uv run pip-audit
```

Les tests unitaires n'ont besoin ni d'une clé AgroFlux ni d'une base PostgreSQL. Les tests de migration utilisent `DATABASE_URL` lorsqu'elle vise `agri_test`.

## Problèmes courants

### Variable obligatoire absente

Le démarrage s'arrête avec `Configuration invalide : app_env absente.` Renseigner `APP_ENV` dans l'environnement ou dans `backend/.env`.

### Port déjà utilisé

Uvicorn signale `Address already in use`. Relancer sur un autre port :

```bash
uv run uvicorn app.main:create_app --factory --host 127.0.0.1 --port 8001
```

### Python différent de 3.12

`uv sync` utilise Python 3.12 grâce à `.python-version`. Si cette version manque, uv peut l'installer. Ne pas lancer l'API avec le Python 3.14 du système sans régénérer le verrou.

## Limites connues

- Aucun connecteur AgroFlux : le contrat fournisseur n'est pas disponible.
- `GET /health` ne vérifie pas PostgreSQL. La connexion se lit sur `GET /database/status`.
- La limitation de débit n'est pas active : les seuils ne sont pas encore choisis.
- Les scripts `ios` et le mobile ne sont pas modifiés par ce socle.
