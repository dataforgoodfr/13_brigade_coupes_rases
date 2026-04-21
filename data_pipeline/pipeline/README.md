# Pipeline mensuelle — Mise à jour des coupes rases

## Objectif

Chaque mois, la pipeline détecte les nouveaux clusters SUFOSAT depuis le dernier millésime en base, les enrichit avec les données de référence, et produit un fichier gold dans S3 que le backend consomme pour mettre à jour la base de données.

**La pipeline ne fait aucune écriture en base de données.** Elle lit la base (source de vérité) et écrit uniquement dans S3.

---

## Flow

```
1. Lecture de la dernière date en base
   SELECT MAX(observation_end_date) FROM clear_cuts

2. Vérification Zenodo
   → Pas de nouveau millésime : arrêt
   → Nouveau millésime : téléchargement + upload S3 bronze

3. Téléchargement des données de référence (S3 bronze)
   bdforet / natura2000 / slope / cadastre

4. Prétraitement SUFOSAT
   Polygonisation du raster, filtrage à partir de la dernière date en base

5. Enrichissement
   Intersection avec bdforet, natura2000, pente, communes

6. Comparaison avec la base de données courante
   → Export DB → FGB local (référentiel de comparaison)
   → Split : clusters nouveaux vs clusters mis à jour (buffer 50m)
   → Fusion des géométries mises à jour avec l'historique

   Premier run (base vide) : le fichier enrichi devient directement le gold final.

7. Upload S3 gold
   current  →  previous   (rotation)
   clusters_final.fgb  →  current
```

---

## Fichier de sortie S3

| Clé S3 | Contenu |
|--------|---------|
| `data_pipeline/gold/sufosat/current/sufosat_clusters_enriched.fgb` | Dernière version complète (lue par le backend) |
| `data_pipeline/gold/sufosat/previous/sufosat_clusters_enriched.fgb` | Millésime précédent |

Endpoint Scaleway : `https://s3.fr-par.scw.cloud`  
Bucket : `brigade-coupe-rase-s3`

URL complète du fichier courant :
```
https://s3.fr-par.scw.cloud/brigade-coupe-rase-s3/data_pipeline/gold/sufosat/current/sufosat_clusters_enriched.fgb
```

---

## Lancer la pipeline

### En local avec Docker

Depuis le dossier `data_pipeline/` :

```bash
# Build
docker build -t data-pipeline:latest .

# Run
docker run --rm --env-file .env -e PYTHONUNBUFFERED=1 data-pipeline:latest
```

En mode interactif pour débugger :
```bash
docker run -it --rm --env-file .env data-pipeline:latest bash
# puis dans le conteneur :
conda activate py3_13
python -m pipeline.scripts.run_pipeline
```

### Variables d'environnement requises (`.env`)

```
DATABASE_URL=postgresql://user:password@host:5432/dbname
S3_ENDPOINT=https://s3.fr-par.scw.cloud
S3_BUCKET_NAME=brigade-coupe-rase-s3
SCW_ACCESS_KEY=...
SCW_SECRET_KEY=...
```

---

## Structure des scripts

```
pipeline/scripts/
├── run_pipeline.py            # Orchestration principale
├── get_last_version.py        # Lecture de la dernière date en base (SQL)
├── get_sufosat_tiff.py        # Vérification et téléchargement Zenodo
├── get_reference_data.py      # Données de référence depuis S3 bronze
├── preprocess_sufosat.py      # Polygonisation + filtrage du raster
├── enrich_sufosat_clusters.py # Enrichissement multi-sources (Dask)
├── get_new_and_update.py      # Comparaison new/updated, fusion géométries
├── upload_gold.py             # Rotation et upload S3 gold
├── db_export.py               # Export DB → FGB local (référentiel de comparaison)
└── utils/
    ├── s3_utils.py            # S3Manager (Scaleway)
    └── ...
```


  docker build -t data-pipeline:latest . && docker run --rm --env-file .env -e PYTHONUNBUFFERED=1 data-pipeline:latest