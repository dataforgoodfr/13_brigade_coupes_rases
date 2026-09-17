# Contribuer à Brigade des Coupes Rases

## Pour commencer

1. [Rejoindre](https://dataforgood.fr/join) la communauté Data For Good.
2. Sur le Slack Data For Good, rejoindre le canal `#13_brigade_coupes_rases` et se présenter.
3. Remplir le [formulaire](https://noco.services.dataforgood.fr/dashboard/#/nc/form/da3564a9-5422-4810-a56f-26122c06dddc).
4. Explorer la documentation du projet sur [Outline](https://outline.services.dataforgood.fr/doc/presentation-du-projet-p8g6j1J3ZT) : présentation, objectifs et comptes rendus des réunions avec Canopée.
5. Installer le projet en suivant le [README](./README.md), puis le README du sous-projet concerné : [backend](./backend/README.md), [frontend](./frontend/README.md) ou [data pipeline](./data_pipeline/README.md).
6. Lire [doc/architecture.md](./doc/architecture.md) : vocabulaire, modèle de données, cycle de vie d'un signalement, organisation du code.

Les étapes 1 à 4 concernent les bénévoles Data For Good ; le dépôt est public et une contribution par pull request depuis un fork est bienvenue sans elles.

Pour obtenir un accès en écriture au dépôt, contactez les responsables sur le canal Slack.

## Branches

- `main` est la branche par défaut et reçoit les pull requests.
- La mise en production se fait en publiant une release (voir le [README](./README.md#branches-et-déploiement)).

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
- Liez la PR à l'[issue GitHub](https://github.com/dataforgoodfr/13_brigade_coupes_rases/issues) correspondante dans la description (`Closes #123`), ou au ticket NocoDB pour les bénévoles Data For Good.
- Décrivez ce qui change et comment le tester ; le [modèle de PR](./.github/pull_request_template.md) est pré-rempli à l'ouverture.
- Demandez une relecture à un autre bénévole du projet.
