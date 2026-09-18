# Backend Brigade des Coupes Rases

API FastAPI + SQLAlchemy sur PostgreSQL/PostGIS. Écoute sur le port **8080**.

## Données

Toutes les coordonnées renvoyées par l'API sont au format latitude/longitude.

## Développement

### Prérequis

- Python 3.14 et [Poetry](https://python-poetry.org/docs/#installation)
- Une base PostgreSQL/PostGIS en marche : `docker compose up db pgadmin` depuis
  la racine du dépôt (crée les bases `local` et `test`, voir
  [docker/README.md](../docker/README.md)).

### Installation

```bash
cd backend
poetry install                 # dépendances d'exécution (groupe "backend") et de développement
poetry run alembic upgrade head
make seed-dev-db               # admin@example.com / admin, volunteer@example.com / volunteer
make devserver                 # http://localhost:8080/docs
```

`make help` liste les autres cibles (`generate-migration`, `reset-db`,
`seed-prd-db`, …).

### Alternative : Docker

Depuis la racine du dépôt, `docker compose up` (ou `./start_docker.sh`, qui
migre et peuple aussi la base) démarre la base, le backend sur le port 8080 et
le frontend sur le port 8081.

Sous VS Code, `backend/` peut s'ouvrir dans le devcontainer (`.devcontainer/`,
extension `ms-vscode-remote.remote-containers`) ; il réutilise le service
`backend` de `docker-compose.yml`.

### Lancer les tests

```bash
make test-unit    # tests unitaires seuls (test/unit/), sans base de données
make upgrade-test-db && make test    # tous les tests avec couverture, base de test migrée
```

`test/unit/` contient les tests qui tournent sans base (fonctions pures,
schémas, jetons). Tout le reste utilise la fixture `db`, qui migre et peuple la
base de test. La configuration de la couverture est dans `pyproject.toml`
(`[tool.coverage.*]`).

### Vérification des types

```bash
make typecheck    # mypy, périmètre défini dans pyproject.toml ([tool.mypy])
```

### Ajouter une dépendance du backend

```bash
poetry add nom-du-paquet --group backend
```

### Utiliser l'API

Une fois le serveur lancé, l'API répond sur `http://localhost:8080` et la
documentation OpenAPI, générée depuis le code, sur `http://localhost:8080/docs`.

### Variables d'environnement

`app/config.py` lit les variables depuis `.env` s'il existe, sinon depuis
`.env.test` quand `ENVIRONMENT=test`, sinon depuis `.env.development`.

| Variable | Obligatoire | Description |
|---|---|---|
| `DATABASE_URL` | oui | Chaîne de connexion PostgreSQL |
| `ENVIRONMENT` | oui | `development`, `test` ou `production` |
| `PORT` | oui | Port HTTP |
| `JWT_SECRET_KEY` | oui | Clé de signature des jetons d'accès, de rafraîchissement et de réinitialisation du mot de passe ; au moins 32 caractères en production (`openssl rand -hex 32`) |
| `ALLOWED_ORIGINS` | non | Origines autorisées pour CORS, séparées par des virgules |
| `DB_POOL_SIZE`, `DB_MAX_OVERFLOW`, `DB_POOL_RECYCLE_SECONDS` | non | Pool de connexions SQLAlchemy (défauts 3, 2 et 1800 s) ; garder `DB_POOL_SIZE + DB_MAX_OVERFLOW` sous la limite de connexions du plan PostgreSQL |
| `MAP_MAX_POINTS` | non | Nombre maximal de points individuels renvoyés par la carte (défaut 2000) ; `total` compte toujours tous les signalements |
| `API_DOCS_ENABLED` | non | Expose `/docs`, `/redoc` et `/openapi.json` en production (toujours exposés hors production) |
| `IMPORTS_TOKEN` | non | Jeton attendu dans l'en-tête `x-imports-token` par la route d'import des signalements |
| `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME`, `S3_PREFIX`, `S3_REGION`, `S3_ENDPOINT` | non | Stockage objet des photos des formulaires ; sans ces variables, les envois sont stockés localement |
| `FRONTEND_URL` | non | Adresse publique du frontend, utilisée dans les liens des e-mails (défaut `http://localhost:5173`) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USE_TLS`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | non | Relais SMTP pour les e-mails (attribution, validation refusée, mot de passe oublié) ; sans `SMTP_HOST`, les e-mails sont seulement journalisés. En local, `docker compose up` fournit [Mailpit](http://localhost:8025) |

`.env.development` et `.env.test` sont versionnés avec des valeurs pour une base
locale uniquement. Les valeurs de production sont définies sur Clever Cloud et
référencées dans la base KeePass partagée.

### Clever Cloud

- Application : [https://app-5292f305-0563-4fd7-b50a-56f6caf806db.cleverapps.io/](https://app-5292f305-0563-4fd7-b50a-56f6caf806db.cleverapps.io/)
- Swagger UI : `/docs`, `/redoc` et `/openapi.json` sont fermés en production sauf si `API_DOCS_ENABLED=true` (en local : [http://localhost:8080/docs](http://localhost:8080/docs))
- Base de données : add-on PostgreSQL, chaîne de connexion dans la base KeePass.

Le déploiement se déclenche en publiant une release GitHub, voir le
[README principal](../README.md#branches-et-déploiement).

## Schéma de la base

Le diagramme entité-association est dans [doc/architecture.md](../doc/architecture.md#modèle-de-données) ; le régénérer depuis les modèles avec `make erd` après une migration.
