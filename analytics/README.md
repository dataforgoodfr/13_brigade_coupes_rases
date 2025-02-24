## Preprocessed data description

- `data/sufosat/sufosat_clear_cuts_2024.fgb` is a FlatGeobuf vector file containing polygons of clear-cut areas detected in France since January 2024, derived from [SUFOSAT](https://ee-sufosatclearcuts.projects.earthengine.app/view/sufosat-clearcuts-fr) data. The file includes clear-cuts larger than 0.5 hectares, with nearby clear-cuts (within 50 meters and 28 days) merged into single events. Each polygon, stored in Lambert-93 projection, includes attributes for the event's start date (`date_min`), end date (`date_max`), duration in days (`days_delta`), number of merged original polygons (`clear_cut_group_size`), and area in hectares (`area_ha`). It is generated using the `notebooks/prepare_sufosat_layer.ipynb` notebook.

- `data/ign/bdalti25/slope_gte_30.tif` is a compressed GeoTIFF raster covering the entirety of France in Lambert-93 projection. Each pixel represents whether the terrain slope is greater than or equal to 30%. Pixels that meet this condition are assigned a value of 1, while all other pixels are set to 0. The resolution of the raster is 25m x 25m. This file is derived from the [IGN's BD ALTI digital elevation model](https://geoservices.ign.fr/bdalti), and it is generated using the `notebooks/prepare_ign_slope_raster.ipynb` notebook.

- `data/ign/bdalti25/slope_gte_30.fgb` is the vectorized version of `/data/ign/bdalti25/slope_gte_30.tif`

## How to download the preprocessed data

- Get your Scaleway credentials from Vaultwarden.

- Install the [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html#getting-started-install-instructions).
  You can also use the [Scaleway CLI](https://www.scaleway.com/en/cli/) directly if you prefer.
  This guide covers the AWS CLI for now, as it is more widely used.

- Create or update your `~/.aws/config` file:

  ```
  [profile d4g-s13-brigade-coupes-rases]
  region = fr-par
  services = d4g-s13-brigade-coupes-rases


  [services d4g-s13-brigade-coupes-rases]
  s3 =
    endpoint_url = https://s3.fr-par.scw.cloud
  s3api =
    endpoint_url = https://s3.fr-par.scw.cloud
  ```

- Create or update your `~/.aws/credentials` file:

  ```
  [d4g-s13-brigade-coupes-rases]
  aws_access_key_id = YOUR_ACCESS_KEY
  aws_secret_access_key = YOUR_SECRET_KEY
  ```

- Run the following command to list the files that will be downloaded from S3:

  ```bash
  aws s3 ls s3://brigade-coupe-rase-s3/analytics/data/ --recursive --profile d4g-s13-brigade-coupes-rases
  ```

- Run the following command from the root of your project to sync local files with the S3 data storage:

  ```bash
  aws s3 sync s3://brigade-coupe-rase-s3/analytics/data/ analytics/data/ --exact-timestamps --profile d4g-s13-brigade-coupes-rases
  ```
