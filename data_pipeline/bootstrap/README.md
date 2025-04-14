# Database Bootstrapping for SUFOSAT Historical Detections (2018-2025)

This guide explains how to load historical SUFOSAT clear-cut detections into the database, including their enrichment with Natura 2000 zone information.

## Option 1: Process the Raw Data (2-3 hours)

Run the complete pipeline to process raw data files into the enriched format required for database seeding:

```bash
python -m bootstrap.scripts.run_pipeline
```

This creates:

- `bootstrap/data/sufosat/sufosat_clusters_enriched.fgb`: Enriched clear-cut detections
- `bootstrap/data/natura2000/natura2000_concat.fgb`: Natura 2000 zone information

## Option 2: Use Pre-processed Files

Download the already processed files from S3 (much faster).
Check available files:

```bash
aws s3 ls s3://brigade-coupe-rase-s3/dataeng/bootstrap/ --recursive --profile d4g-s13-brigade-coupes-rases
```

You should see something like this:

```
2025-04-14 13:20:05   87660704 dataeng/bootstrap/natura2000/natura2000_concat.fgb
2025-04-14 13:19:30 2172985856 dataeng/bootstrap/sufosat/sufosat_clusters_enriched.fgb
```

Download the files:

```bash
aws s3 sync s3://brigade-coupe-rase-s3/dataeng/bootstrap/ bootstrap/data/ --exact-timestamps --profile d4g-s13-brigade-coupes-rases
```

## Database Seeding

Once you have the required files (either from Option 1 or Option 2), seed the database:

⚠️ **WARNING: This command will erase existing database contents** ⚠️

```bash
python -m bootstrap.scripts.seed_database \
    --natura2000-concat-filepath bootstrap/data/natura2000/natura2000_concat.fgb \
    --enriched-clear-cuts-filepath bootstrap/data/sufosat/sufosat_clusters_enriched.fgb \
    --database-url postgresql://devuser:devuser@localhost:5432/local \
    --sample 1000
```

This will populate the database with a sample of 1000 historical clear-cut detections from 2018 to 2025.
The `--sample` parameter is optional.
