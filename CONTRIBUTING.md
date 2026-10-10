# Contribuer à Brigade des Coupes Rases

## Pour commencer

1. Installer le projet en suivant le [README](./README.md), puis le README du sous-projet concerné : [backend](./backend/README.md), [frontend](./frontend/README.md) ou [data pipeline](./data_pipeline/README.md).
2. Lire [docs/architecture.md](./docs/architecture.md) : vocabulaire, modèle de données, cycle de vie d'un signalement, organisation du code.
3. Choisir ou ouvrir une [issue GitHub](https://github.com/dataforgoodfr/13_brigade_coupes_rases/issues) pour le sujet traité.

Les contributions arrivent par pull request depuis un fork. Les questions et propositions passent par les issues.

## Branches

- `main` est la branche par défaut et reçoit les pull requests.
- La mise en production se fait en publiant une release (voir le [guide des opérations](./docs/operations.md#branches-et-déploiement)).

Nommage des branches de travail :

- `feature/nom_de_la_feature` pour une nouvelle fonctionnalité
- `chore/nom_du_chore` pour une modification qui ne change ni l'interface ni les fonctionnalités
- `hotfix/nom_du_hotfix` pour une correction rapide

## Commits

Les messages suivent la convention [Conventional Commits](https://gist.github.com/qoomon/5dfcdf8eec66a051ecd85625518cfd13) :

```
type(portée optionnelle): description

corps optionnel

pied optionnel
```

Exemple : `chore(readme): ajouter détails pour contribuer au repo`.

## Avant d'ouvrir une pull request

Les mêmes vérifications tournent en CI ; les lancer en local évite un aller-retour.

- Python (backend, data pipeline) : `pre-commit run --all-files` à la racine (ruff, formatage). Une fois [pre-commit](https://pre-commit.com/) installé, `pre-commit install` à la racine lance ces vérifications à chaque commit.
- Backend : `make test` et `make typecheck` (mypy) dans `backend/`.
- Data pipeline : `poetry run mypy` dans `data_pipeline/`.
- Frontend : `pnpm lint`, `pnpm test:unit`, `pnpm build` et `pnpm test:browser` dans `frontend/` (`pnpm test` lance les deux projets Vitest en mode watch).

## Pull requests

- Une PR par sujet, aussi petite que possible.
- Liez la PR à l'[issue GitHub](https://github.com/dataforgoodfr/13_brigade_coupes_rases/issues) correspondante dans la description (`Closes #123`).
- Décrivez ce qui change et comment le tester ; le [modèle de PR](./.github/pull_request_template.md) est pré-rempli à l'ouverture.
- Demandez une relecture à un mainteneur du projet.
