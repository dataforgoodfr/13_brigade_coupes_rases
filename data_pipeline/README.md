# Documentation pipeline

## 1 - Information sur l'image Docker

> On se base sur la documentation officielle de Airflow. [ici](https://airflow.apache.org/docs/apache-airflow/stable/howto/docker-compose/index.html). <br /> avec quelques modification (cf. processus d'installation)


## 2 - Processus d'installation

> S'assurer qu'on est à la racine de data_pipeline et ajouter les dossiers (logs/, config/ et plugins/) à la racine du fichier. N'oubliez pas de coller les config.json dans la conversation slack dans config

1. Ajouter le AIRFLOW_UID avec la commande 
```bash
mkdir -p ./logs ./plugins ./config
echo -e "AIRFLOW_UID=$(id -u)" > .env
```

2. Installer l'image airflow custom
```bash
docker build . --tag bcr_dataeng_aiflow:latest
```

3. Construire l'image 
```bash
docker compose up airflow-init
```

4. Lancer l'image 
```bash
docker-compose up
```

## Utils --> S3 

> [Documentation](https://airflow.apache.org/docs/apache-airflow-providers-amazon/stable/_api/airflow/providers/amazon/aws/hooks/s3/index.html) officielle pour un CRUD simple pour S3. 


## 
Il faut créer un fichier .env dans le dossier data_pipeline/utils/config avec les variables necessaires la configuration de Airflow

```text
BUCKET_NAME={BUCKET_NAME}
URL=...
Etc
```
Vous trouverez un example avec le fichier [.env.example](config/.env.example)
