**Scripts and notebook to bootstrap the database with SUFOSAT historical detections 2018-2025**

First, run the pipeline to create the `data/sufosat/sufosat_clusters_enriched.fgb` file.
It can take a few hours.

```bash
python -m scripts.run_pipeline
```

Then, run the `notebooks/seed_database.ipynb` notebook to seed the database.

⚠️ _Danger zone, the beginning of the notebook wipes the database._ ⚠️
