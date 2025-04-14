**Scripts and notebook to bootstrap the database with SUFOSAT historical detections 2018-2025**

First, run the pipeline to create the `bootstrap/data/sufosat/sufosat_clusters_enriched.fgb` and `bootstrap/data/natura2000/natura2000_concat.fgb` files.
It can take 2-3 hours to run it from end to end.

```bash
python -m bootstrap.scripts.run_pipeline
```

Then, you can seed the datbase.

⚠️ _Danger zone, this wipes the database._ ⚠️

```bash
python -m bootstrap.scripts.seed_database --natura2000-concat-filepath bootstrap/data/natura2000/natura2000_concat.fgb --enriched-clear-cuts-filepath bootstrap/data/sufosat/sufosat_clusters_enriched.fgb --database-url postgresql://devuser:devuser@localhost:5432/local
```

If you want to seed the database with already-preprocessed files, you can download them from S3:

```bash
aws s3 ls s3://brigade-coupe-rase-s3/dataeng/bootstrap/ --recursive --profile d4g-s13-brigade-coupes-rases
```

You should see something like this:

```
2025-04-14 13:20:05   87660704 dataeng/bootstrap/natura2000/natura2000_concat.fgb
2025-04-14 13:19:30 2172985856 dataeng/bootstrap/sufosat/sufosat_clusters_enriched.fgb
```

Run the following command to download the files from S3:

```bash
aws s3 sync s3://brigade-coupe-rase-s3/dataeng/bootstrap/ bootstrap/data/ --exact-timestamps --profile d4g-s13-brigade-coupes-rases
```
