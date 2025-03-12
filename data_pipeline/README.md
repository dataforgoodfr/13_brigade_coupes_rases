## ETL cron

1. Ajouter les répertoires data_temp et logs

```bash
mkdir data_temp logs
```

2. Installation Docker (s'assurer d'être sur le répertoire data_pipeline)
```bash
    docker build -t data_pipeline . 
```

3. Lancer le docker
```bash
    docker run -d --name pipeline data_pipeline 
```


```bash
#!/bin/bash
# Structure du projet
.
data_pipeline/
├── config/
│   ├── config.yaml
├── data_temp/
├── logs/
│   ├── extract.log
│   ├── transform.log
├── scripts/
│   ├── utils/
│   │   ├── .env # Temporaire le temps de mettre en place keypass
│   │   ├── date_parser.py
│   │   ├── disjoin_set.py
│   │   ├── logging.py
│   │   ├── s3.py
│   ├── extract.py
│   ├── main.py
│   ├── transform.py

```

## KeePass

- KeePass is the password manager used to store AWS credentials. These credentials are securely stored in the project's KeePass database.

- To use it, ensure that you have:

### The password for the KeePass file, stored in the `data_pipeline/.env` file locally  
Template of file to follow :  
````sh
KEEPASS_PASSWORD= votre_mot_de_passe # À compléter localement par chaque utilisateur
````

### The KeePass file, stored locally  

- Once these requirements are met, launch the `PyKeePass.py` file. The variables `access_key` and `secret_key` will contain the AWS S3 bucket access and secret keys.  


