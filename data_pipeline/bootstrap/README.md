# Chargement initial des détections SUFOSAT (2018-2025)

Ce guide explique comment charger en base l'historique des détections de coupes
rases SUFOSAT, enrichies des zonages Natura 2000.

## Option 1 : traiter les données brutes (2 à 3 heures)

Lancer la chaîne complète, qui transforme les fichiers bruts au format attendu
par le chargement :

```bash
python -m bootstrap.scripts.run_pipeline
```

Elle produit :

- `bootstrap/data/sufosat/sufosat_clusters_enriched.fgb` : détections enrichies ;
- `bootstrap/data/natura2000/natura2000_concat.fgb` : zonages Natura 2000.

## Option 2 : utiliser les fichiers déjà traités

Télécharger les fichiers depuis S3 (beaucoup plus rapide). Vérifier les fichiers
disponibles :

```bash
aws s3 ls s3://brigade-coupe-rase-s3/dataeng/bootstrap/ --recursive --profile d4g-s13-brigade-coupes-rases
```

Résultat attendu :

```
2025-04-14 13:20:05   87660704 dataeng/bootstrap/natura2000/natura2000_concat.fgb
2025-04-14 13:19:30 2172985856 dataeng/bootstrap/sufosat/sufosat_clusters_enriched.fgb
```

Télécharger les fichiers :

```bash
aws s3 sync s3://brigade-coupe-rase-s3/dataeng/bootstrap/ bootstrap/data/ --exact-timestamps --profile d4g-s13-brigade-coupes-rases
```

## Chargement en base

Une fois les fichiers obtenus (option 1 ou 2), charger la base :

⚠️ **Attention : cette commande efface le contenu de la base.** ⚠️

```bash
python -m bootstrap.scripts.seed_database \
    --natura2000-concat-filepath bootstrap/data/natura2000/natura2000_concat.fgb \
    --enriched-clear-cuts-filepath bootstrap/data/sufosat/sufosat_clusters_enriched.fgb \
    --database-url postgresql://devuser:devuser@localhost:5432/local \
    --sample 1000
```

La base reçoit un échantillon de 1 000 détections historiques de 2018 à 2025.
Le paramètre `--sample` est facultatif : sans lui, toutes les coupes sont
chargées, ce qui demande une machine avec 32 Go de RAM (_l'insertion pourrait
sans doute être optimisée pour consommer moins de mémoire_).

Les scripts importent GDAL (`osgeo`) : les lancer depuis l'image Docker de
`data_pipeline/` ou un environnement conda, voir le
[README de data_pipeline](../README.md).
