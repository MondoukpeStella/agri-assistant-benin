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

Si `APP_ENV` est absente ou invalide, le processus s'arrête avant d'écouter. Le message cite le nom du paramètre et ne répète pas la valeur reçue. Une origine CORS `*` est refusée.

Aucune variable n'est requise pour PostgreSQL ou AgroFlux dans ce socle.

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

La documentation interactive est disponible en `development` et `test` sur `/docs`. Elle est désactivée lorsque `APP_ENV=production`.

`POST /api/v1/probe` accepte un objet JSON `{"message":"..."}` afin de vérifier la validation des requêtes. Cette route ne consulte pas de prix.

## Vérifications

```bash
cd backend
uv run ruff check .
uv run ruff format --check .
uv run pytest
uv run bandit -r app -q
uv run pip-audit
```

Les tests n'ont besoin ni d'une clé AgroFlux ni d'une base PostgreSQL.

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
- `GET /health` ne vérifie pas PostgreSQL. Un contrôle de dépendance viendra avec la configuration de la base.
- La limitation de débit n'est pas active : les seuils ne sont pas encore choisis.
- Les scripts `ios` et le mobile ne sont pas modifiés par ce socle.
