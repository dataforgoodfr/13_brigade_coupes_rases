# Brigade des Coupes Rases 🌳

# Summary

## Backend

[Backend](./backend/README.md)
## Frontend

[Frontend](./frontend/README.md)

## Analytics

[Analytics](./analytics/README.md)

## Doc

[Documentation](./doc/README.md)

# Contexte du Projet

La déforestation et les coupes rases illégales représentent une menace majeure pour les écosystèmes et la biodiversité. Cependant, il existe un manque de transparence et de contrôle efficace sur ces pratiques, rendant difficile leur suivi et leur régulation.

Canopée, une association engagée pour la protection des forêts, cherche à automatiser la détection des coupes rases abusives en utilisant un algorithme de surveillance satellite. Actuellement, les alertes générées doivent être centralisées, analysées et validées, mais ce processus reste manuel et fastidieux.

# Objectifs du Projet

L’objectif est de développer une solution complète pour :
• Automatiser le traitement des données des coupes rases détectées par l’algorithme existant (GlobEO).
• Créer une base de données pour stocker et organiser les informations sur chaque coupe rase détectée.
• Créer une application permettant d’interagir avec la base de données pour ajouter, modifier ou supprimer des informations sur chaque coupe rase détectée.
• Développer une interface de visualisation pour identifier les coupes rases illégales et générer des statistiques exploitables.
Optionellement :
• Repliquer l'identification de coupe rases (algorithme existant fourni par GlobEO) poour reduire le temps de mise a jour du processus existant.

# Contributing

## Pour commencer

1. [Rejoindre](https://dataforgood.fr/join) la communauté Data For Good
2. Sur le slack Data For Good, rejoindre le canal \_#13_brigade_coupes_rases et se présenter
3. Remplir le [formulaire](https://noco.services.dataforgood.fr/dashboard/#/nc/form/da3564a9-5422-4810-a56f-26122c06dddc)
4. Explorer la documentation du projet. Familiarisez vous avec le projet, ses objectifs via [Outline](https://outline.services.dataforgood.fr/doc/presentation-du-projet-p8g6j1J3ZT). Notamment, vous trouverez les CR des premières réunions avec Canopée qui spécifient les avancées du projet.

## Pour contribuer

Pour contribuer, il est recommandé d'utiliser un fork du projet. Cela permet d'éviter la gestion des demandes d'accès au dépôt principal.

Dans un premier temps, cliquez sur Fork pour récupérer le projet dans votre espace GitHub.

- Créez votre branche de travail à partir de la branche main, en respectant la nomenclature suivante:

  - feature/nom_de_la_feature pour une nouvelle fonctionnalité
  - chore/nom_du_chore pour une modification de code qui ne change pas l'interface utilisateur ou les fonctionnalités existantes
  - hotfix/nom_du_hotfix pour une correction rapide

- Poussez votre code vers votre dépôt distant.

- Chaque commit doit suivre la convention de style suivante :

  - Complete convention cheatsheet [HERE](https://gist.github.com/qoomon/5dfcdf8eec66a051ecd85625518cfd13)
  - Structure:
    - [Type] (optional scope): [Description]
    - [Optional Body]
    - [Optional Footer]
  - Exemple : chore(readme): ajouter détails pour contribuer au repo

- Créez une pull request en spécifiant :

  - Base repository : dataforgood/13_brigade_coupes_rases/main
  - Head repository : YourGithubAccount/13_brigade_coupes_rases/your_branch

- Pour faciliter la revue de la pull request :
  - Liez la pull request à un ticket NocoDB en ajoutant le lien du ticket dans la description.
  - Rédigez une description détaillée de la pull request afin de fournir un maximum d’informations sur les modifications apportées.

## Gestion des secrets

Les secrets partagés entre les membres sont stockés dans une [base de données keepass](./keepass/secrets.kdbx).  
Pour installer keepass suivez ce [lien](https://keepass.info/index.html).  
Un mot de passe est nécessaire pour ouvrir la base de données, lire ou modifier les secrets. Pour récuperer le mot de passe contactez directement les responsables de sous-équipes.

### Bonnes pratiques

Considérez la base de données keepass comme étant la golden source de tous les secrets du projet.  
Chaque secret utilisés dans le projet doit être référencés dans le keepass.  
Exemples de secrets à utiliser dans la base : mot de passe du compte gérant l'infrastructure cloud, CI/CD, clés d'API, chaines de connection pour base de données etc ...

# Architecture du Projet (sujet à améliorer et definir selon les expertises des volonteurs)

L'ideeèr du projet est de créer une architecture modulaire qui permet d'automatiser le traitement des données, de stocker et organiser les informations dans une base de données, et de fournir une interface utilisateur pour interagir avec cette base de données. Voici un exemple possible de l'architecture :

1. **GlobEO Algorithme** : L’algorithme GlobEO détecte les coupes rases dans les images. Télécharger les données de l’algorithme GlobEO dans un format approprié (par exemple, CSV ou JSON).
2. **Traitement des Données** : (À definir) Le traitement des données est effectué par un script Python pour manipuler et analyser les données. Selon les besoins, cela pourrait évoluer (par exemple, orchestration, data quality, monitoring, etc.)
3. **Base de Données** : (À definir) Base de données PostgreSQL avec PostGIS pour stocker les coupes rases et leurs métadonnées spatiales. Cela aussie devrait faciliter le processement spatiale.
4. **Application Web** : (À definir) Une application web Flask ou FastAPI est développée pour gérer (opérations CRUD) les données relatives à chaque coupe rase détectée. (avec un service d'authentification pour les utilisateurs administrateurs).
5. **Interface de Visualisation** : (À definir) Une interface web utilisant Leaflet ou Mapbox est créée pour visualiser les coupes rases sur une carte. Framework aussi à définir.

## Structure du projet

```
📁 13_brigade_coupes_rases
|
├── 📁 backend/ (contient l'API et la gestion de la base de données)
|
├── 📁 frontend/ (contient le code frontend pour la visualisation de données et les formulaires)
|
├── 📁 data_pipeline/ (contient les scripts pour collecter et traiter les données)
|
├── 📁 analytics/ (contient les scripts pour analyser et visualiser les données)
|
└── 📁 misc/ (contient les scripts supplémentaires ou de support, exploration de donnés, etc)
```

### Installer Poetry

Plusieurs [méthodes d'installation](https://python-poetry.org/docs/#installation) sont décrites dans la documentation de poetry dont:

- avec pipx
- avec l'installateur officiel

Chaque méthode a ses avantages et inconvénients. Par exemple, la méthode pipx nécessite d'installer pipx au préable, l'installateur officiel utilise curl pour télécharger un script qui doit ensuite être exécuté et comporte des instructions spécifiques pour la completion des commandes poetry selon le shell utilisé (bash, zsh, etc...).

L'avantage de pipx est que l'installation de pipx est documentée pour linux, windows et macos. D'autre part, les outils installées avec pipx bénéficient d'un environment d'exécution isolé, ce qui est permet de fiabiliser leur fonctionnement. Finalement, l'installation de poetry, voire d'autres outils est relativement simple avec pipx.

Cependant, libre à toi d'utiliser la méthode qui te convient le mieux ! Quelque soit la méthode choisie, il est important de ne pas installer poetry dans l'environnement virtuel qui sera créé un peu plus tard dans ce README pour les dépendances de la base de code de ce repo git.

### Installation de Poetry avec pipx

Suivre les instructions pour [installer pipx](https://pipx.pypa.io/stable/#install-pipx) selon ta plateforme (linux, windows, etc...)

Par exemple pour Ubuntu 23.04+:

    sudo apt update
    sudo apt install pipx
    pipx ensurepath

[Installer Poetry avec pipx](https://python-poetry.org/docs/#installing-with-pipx):

    pipx install poetry

### Installation de Poetry avec l'installateur officiel

L'installation avec l'installateur officiel nécessitant quelques étapes supplémentaires,
se référer à la [documentation officielle](https://python-poetry.org/docs/#installing-with-the-official-installer).

### Utiliser un venv python

    python3 -m venv .venv

    source .venv/bin/activate

### Utiliser Poetry

Installer les dépendances:

    poetry install

Ajouter une dépendance:

    poetry add pandas

Mettre à jour les dépendances:

    poetry update

### Lancer les precommit-hook localement

[Installer les precommit](https://pre-commit.com/)

    pre-commit run --all-files

### Utiliser Tox pour tester votre code

    tox -v
