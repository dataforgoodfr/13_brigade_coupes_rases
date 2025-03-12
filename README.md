# Brigade des Coupes Rases 🌳

- [Backend](./backend/README.md)
- [Frontend](./frontend/README.md)
- [Data Eng](./data_pipeline/README.md)
- [Analytics](./analytics/README.md)
- [Documentation](./doc/README.md)

# Contexte du Projet

La déforestation et les coupes rases illégales représentent une menace majeure pour les écosystèmes et la biodiversité. Cependant, il existe un manque de transparence et de contrôle efficace sur ces pratiques, rendant difficile leur suivi et leur régulation.

Canopée, une association engagée pour la protection des forêts, cherche à automatiser la détection des coupes rases abusives en utilisant un algorithme de surveillance satellite. Actuellement, les alertes générées doivent être centralisées, analysées et validées, mais ce processus reste manuel et fastidieux.

# Objectifs du Projet

L’objectif est de développer une solution complète pour :

- Automatiser le traitement des données des coupes rases détectées par l’algorithme existant (GlobEO).
- Créer une base de données pour stocker et organiser les informations sur chaque coupe rase détectée.
- Créer une application permettant d’interagir avec la base de données pour ajouter, modifier ou supprimer des informations sur chaque coupe rase détectée.
- Développer une interface de visualisation pour identifier les coupes rases illégales et générer des statistiques exploitables.
  Optionellement :
- Repliquer l'identification de coupe rases (algorithme existant fourni par GlobEO) poour reduire le temps de mise a jour du processus existant.

# Contributing

## Pour commencer

1. [Rejoindre](https://dataforgood.fr/join) la communauté Data For Good
2. Sur le slack Data For Good, rejoindre le canal \_#13_brigade_coupes_rases et se présenter
3. Remplir le [formulaire](https://noco.services.dataforgood.fr/dashboard/#/nc/form/da3564a9-5422-4810-a56f-26122c06dddc)
4. Explorer la documentation du projet. Familiarisez vous avec le projet, ses objectifs via [Outline](https://outline.services.dataforgood.fr/doc/presentation-du-projet-p8g6j1J3ZT). Notamment, vous trouverez les CR des premières réunions avec Canopée qui spécifient les avancées du projet.

## Pour contribuer

Pour contribuer, vous pouvez demander un accès au projet sur github.  Pour cela, contactez les responsables sur le slack Data For Good `#13_brigade_coupes_rases` .

Essayez de respecter les conventions de code et le style d'écriture du projet:

  - feature/nom_de_la_feature pour une nouvelle fonctionnalité
  - chore/nom_du_chore pour une modification de code qui ne change pas l'interface utilisateur ou les fonctionnalités existantes
  - hotfix/nom_du_hotfix pour une correction rapide


Chaque commit doit suivre la convention de style suivante :

  - Convention complète de style, cheatsheet [HERE](https://gist.github.com/qoomon/5dfcdf8eec66a051ecd85625518cfd13)
  - Structure:
    - [Type] (optional scope): [Description]
    - [Optional Body]
    - [Optional Footer]
  - Exemple : chore(readme): ajouter détails pour contribuer au repo

Créez une pull request.

- Pour faciliter la revue de la pull request :
  - Liez la pull request à un ticket NocoDB en ajoutant le lien du ticket dans la description.
  - Rédigez une description détaillée de la pull request afin de fournir un maximum d’informations sur les modifications apportées.



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
└── 📁 analytics/ (contient les scripts pour analyser et visualiser les données)
```


## Diagramme

Pour visualiser ce graph sur VS Code, vous pouvez installer des plugins comme "Markdown Preview Enhanced". 

Le graph est pas nécessairement complet, mais il donne une idée de l'architecture générale du projet. 

```mermaid
flowchart LR
    %% External Entities
    SOURCES[Public Data Sources<br>Monthly & One-Time] -->|Fetch Data| ETL
    Users[End Users] -->|Access<br>via Browser| FRONT

    %% Main Clever Cloud subgraph
    subgraph CC["CleverCloud"]
    
      %% Data Engineering Subgraph
      subgraph DE["Data Engineering"]
      ETL[Docker-based Ingestion Jobs]
      Cron[CleverCloud Cron Add-On]
      AutoScale[Autoscaling<br>CleverCloud]
      end

      %% Backend Subgraph
      subgraph BK["Backend"]
      BE[FastAPI Backend<br> - Docker]
      end

      %% Storage Subgraph
      subgraph ST["Storage"]
      S3[(S3 Object Storage)]
      DB[(PostgreSQL w/ PostGIS)]
      end

      %% Frontend Subgraph
      subgraph FE["Frontend"]
      FRONT[Frontend React/Vite<br>]
      end

      %% Observability Subgraph
      subgraph OBS["Observability"]
      Logs[CleverCloud Logs & Metrics]
      end

      %% Shared Environment Variables
      EnvVars[Built-in Env Variables]

    end

    %% Connections & Data Flows
    ETL -->|Raw/Intermediate Data| S3
    ETL -->|Transformed Data| DB
    Cron -->|Triggers| ETL
    AutoScale --> |Autoscales| ETL
    EnvVars -.-> ETL
    EnvVars -.-> BE
    EnvVars -.-> FRONT
    BE -->|Reads/Writes| DB
    BE --> |Reads/Writes Images| S3
    FRONT -->|API Calls| BE
    Logs -.-> ETL
    Logs -.-> BE
    Logs -.-> FRONT

    %% Styles for Readability
    style CC fill:#F0F9FF,stroke:#0369A1,stroke-width:2px,corner-radius:8px
    style DE fill:#ECFEFF,stroke:#05B4FE,stroke-width:1px,corner-radius:8px
    style BK fill:#FFF7ED,stroke:#F97316,stroke-width:1px,corner-radius:8px
    style FE fill:#FFFBEB,stroke:#F59E0B,stroke-width:1px,corner-radius:8px
    style OBS fill:#FAE8FF,stroke:#C026D3,stroke-width:1px,corner-radius:8px

    %% Custom Component Colors
    style DB fill:#CFFAFE,stroke:#0891B2,stroke-width:1px,color:#000000  %% Soft Teal for Storage
    style S3 fill:#CFFAFE,stroke:#0891B2,stroke-width:1px,color:#000000  %% Soft Teal for Storage

    style ETL fill:#FEE2E2,stroke:#DC2626,stroke-width:1px,color:#000000  %% Warm Coral for Docker
    style BE fill:#FEE2E2,stroke:#DC2626,stroke-width:1px,color:#000000  %% Warm Coral for Docker

    style Cron fill:#DBEAFE,stroke:#2563EB,stroke-width:1px,color:#000000  %% Cool Blue for CleverCloud
    style AutoScale fill:#DBEAFE,stroke:#2563EB,stroke-width:1px,color:#000000  %% Cool Blue for CleverCloud
    style Logs fill:#DBEAFE,stroke:#2563EB,stroke-width:1px,color:#000000  %% Cool Blue for CleverCloud

    style FRONT fill:#FEF3C7,stroke:#D97706,stroke-width:1px,color:#000000  %% Soft Amber for Frontend
```

### Utiliser Poetry

Poetry est un gestionnaire de paquets pour Python. Il permet d'installer, de mettre à jour et de gérer les dépendances.
On utilise Poetry dans les repertoires backend, data_pipeline et analytics. Chaque repertoire a un fichier `pyproject.toml` qui contient les dépendances spécifiques à chaque subprojet.
Il y a aussi un fichier projet `pyproject.toml` à la racine du projet qui contient les dépendances globales du projet.

Installer les dépendances:

  Il faut être dans le répertoire backend, data_pipeline ou analytics et exécuter la commande suivante: 

    poetry install

Ajouter une dépendance (par répertoire):

    poetry add pandas

Mettre à jour les dépendances (par répertoire):

    poetry update

### Installer Poetry (version 1.8.5)

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

### Lancer les precommit-hook localement

[Installer les precommit](https://pre-commit.com/)

    poetry run pre-commit run --all-files

## Gestion des secrets

Les secrets partagés entre les membres sont stockés dans une [base de données keepass](./keepass/secrets.kdbx).  
Pour installer keepass suivez ce [lien](https://keepass.info/index.html).  
Un mot de passe est nécessaire pour ouvrir la base de données, lire ou modifier les secrets. Pour récuperer le mot de passe contactez directement les responsables de sous-équipes.

### Bonnes pratiques

Considérez la base de données keepass comme étant la golden source de tous les secrets du projet.  
Chaque secret utilisés dans le projet doit être référencés dans le keepass.  
Exemples de secrets à utiliser dans la base : mot de passe du compte gérant l'infrastructure cloud, CI/CD, clés d'API, chaines de connection pour base de données etc ...