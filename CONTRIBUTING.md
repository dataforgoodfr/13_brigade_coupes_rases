# Contribuer à Brigade des Coupes Rases

## Pour commencer

1. [Rejoindre](https://dataforgood.fr/join) la communauté Data For Good.
2. Sur le Slack Data For Good, rejoindre le canal `#13_brigade_coupes_rases` et se présenter.
3. Remplir le [formulaire](https://noco.services.dataforgood.fr/dashboard/#/nc/form/da3564a9-5422-4810-a56f-26122c06dddc).
4. Explorer la documentation du projet sur [Outline](https://outline.services.dataforgood.fr/doc/presentation-du-projet-p8g6j1J3ZT) : présentation, objectifs et comptes rendus des réunions avec Canopée.
5. Installer le projet en suivant le [README](./README.md), puis le README du sous-projet concerné : [backend](./backend/README.md), [frontend](./frontend/README.md), [data pipeline](./data_pipeline/README.md), [analytics](./analytics/README.md).

Pour obtenir un accès en écriture au dépôt, contactez les responsables sur le canal Slack.

## Branches

- `develop` reçoit les pull requests ; c'est la branche par défaut.
- `main` est la branche déployée (Clever Cloud, Storybook) : un mainteneur y fusionne `develop` par pull request.

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

- Python (backend, data pipeline, analytics) : `pre-commit run --all-files` à la racine (ruff, formatage, [installation de pre-commit](https://pre-commit.com/)).
- Backend : `make test` et `make typecheck` (mypy) dans `backend/`.
- Data pipeline : `poetry run mypy` dans `data_pipeline/`.
- Frontend : `pnpm lint`, `pnpm test:unit`, `pnpm build` et `pnpm test:browser` dans `frontend/` (`pnpm test` lance les deux projets Vitest en mode watch).

## Pull requests

- Une PR par sujet, aussi petite que possible.
- Liez la PR au ticket NocoDB correspondant dans la description.
- Décrivez ce qui change et comment le tester ; le [modèle de PR](./.github/pull_request_template.md) est pré-rempli à l'ouverture.
- Demandez une relecture à un autre bénévole du projet.
