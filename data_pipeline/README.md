# Documentation pipeline

## 1 - Information sur l'image Docker

> On se base sur la documentation officielle de Airflow. [ici](https://airflow.apache.org/docs/apache-airflow/stable/howto/docker-compose/index.html). <br /> avec quelques modification (cf. processus d'installation)


## 2 - Processus d'installation

> S'assurer qu'on est à la racine de data_pipeline et 

1. Installer l'image airflow custom
```bash
docker build . --tag extending_aiflow:latest
```

2. Reconstruire le docker-compose
```bash
docker-compose up -d --no-deps --build airflow-webserver airflow-scheduler
```

3. Lancer l'image 
```bash
docker-compose up
```

## 3 - Vérifications
Si c'est bon le dag **"test_packages"** ne devrait pas être en erreur et afficher les versions des packages dans les logs. 


```text
[2025-02-24, 14:29:30 CET] {logging_mixin.py:190} INFO - Geopandas version :  0.14.4
[2025-02-24, 14:29:30 CET] {logging_mixin.py:190} INFO - rasterio version :  1.4.3
```


## Utils --> S3 

> [Documentation](https://airflow.apache.org/docs/apache-airflow-providers-amazon/stable/_api/airflow/providers/amazon/aws/hooks/s3/index.html) officielle pour un CRUD simple pour S3. 