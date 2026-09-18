# Pipeline mensuelle — Mise à jour des coupes rases

## Objectif

Chaque mois, la pipeline récupère la dernière image d'alertes [RADD Europe](https://data.globalforestwatch.org/documents/gfw::deforestation-alerts-radd/about) depuis Google Earth Engine, détecte les nouveaux clusters de coupes depuis la dernière date en base, les enrichit avec les données de référence, et produit un fichier gold dans S3 que le backend consomme pour mettre à jour la base de données.

Les alertes RADD ont remplacé les millésimes SUFOSAT (Zenodo) : même format de dates (YYDDD), mais une image mise à jour chaque semaine au lieu de deux fois par an. Les scripts et les chemins S3 gardent le nom `sufosat`.

**La pipeline ne fait aucune écriture en base de données.** Elle lit la base (source de vérité) et écrit uniquement dans S3.

---

## Flow

```
1. Lecture de la dernière date en base
   SELECT MAX(observation_end_date) FROM clear_cuts

2. Dernière image RADD dans Earth Engine (couche « alert »)
   → Même version que S3 bronze : réutilisation du raster
   → Nouvelle version : export de la bande Date (Alert >= 2) pour la France
     en EPSG:3035 à 10 m — via un bucket GCS si GCS_RADD_EXPORT_BUCKET est
     défini, sinon tuile par tuile — puis upload S3 bronze

3. Téléchargement des données de référence (S3 bronze)
   bdforet / natura2000 / slope / cadastre

4. Prétraitement
   Polygonisation du raster, filtrage à partir de la dernière date en base
   (au plus tôt le 1er janvier 2026, date de départ du suivi)

5. Enrichissement
   Reprojection en Lambert 93, intersection avec bdforet, natura2000, pente, communes

   Filtres métier : au moins 2 ha, en forêt (BD Forêt), et soit au moins 10 ha,
   soit en zone Natura 2000 ou en pente. Le backend applique ensuite ses propres
   règles (seuils modifiables par les administrateurs).

6. Comparaison avec la base de données courante
   → Export DB → FGB local (référentiel de comparaison)
   → Split : clusters nouveaux vs clusters mis à jour (buffer 50m)
   → Fusion des géométries mises à jour avec l'historique
   → Les coupes corrigées à la main dans l'application (is_manually_edited,
     sans allow_pipeline_override) sont exclues du matching : jamais fusionnées,
     les détections voisines deviennent de nouveaux clusters

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

Depuis la **racine du dépôt** (le Dockerfile attend ce contexte de build, comme
sur Clever Cloud) :

```bash
# Build
docker build -f data_pipeline/Dockerfile -t data-pipeline:latest .

# Run
docker run --rm --env-file data_pipeline/.env -e PYTHONUNBUFFERED=1 data-pipeline:latest
```

En mode interactif pour débugger :
```bash
docker run -it --rm --env-file data_pipeline/.env data-pipeline:latest bash
# puis dans le conteneur :
conda activate py3_14
python -m pipeline.scripts.run_pipeline
```

### Variables d'environnement requises (`.env`)

```
DATABASE_URL=postgresql://user:password@host:5432/dbname
S3_ENDPOINT=https://s3.fr-par.scw.cloud
S3_BUCKET_NAME=brigade-coupe-rase-s3
S3_REGION=fr-par
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
EARTH_ENGINE_PROJECT=...
GOOGLE_SERVICE_ACCOUNT_KEY='{"type": "service_account", ...}'
```

Optionnel : `GCS_RADD_EXPORT_BUCKET` (et `GCS_RADD_EXPORT_PREFIX`) pour passer
par un export Earth Engine vers Google Cloud Storage au lieu du téléchargement
tuile par tuile, beaucoup plus lent. Détail des variables dans
[`.env.example`](../.env.example).

---

## Structure des scripts

```
pipeline/scripts/
├── run_pipeline.py            # Orchestration principale
├── get_last_version.py        # Lecture de la dernière date en base (SQL)
├── get_sufosat_tiff.py        # Export du raster RADD depuis Earth Engine
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
