## Analytics data processing

![](./diagram/Analytics%20Brigade%20Coupes%20Rases.drawio.png)

## Setup

Install the dependencies in a virtual environment:

```bash
poetry config virtualenvs.create true
poetry config virtualenvs.in-project true
poetry install --with analytics
source .venv/bin/activate
```

We also need [GDAL](https://gdal.org/en/stable/) to handle some geospatial data processing.
We are installing it separated from Poetry due to system-specific dependencies.
For Ubuntu/Debian, install GDAL using your system's package manager:

```bash
sudo apt update
sudo apt install gdal-bin libgdal-dev
```

Confirm that GDAL was installed successfully:

```bash
gdalinfo --version
```

To use GDAL in Python, install the matching pip package:

```bash
sudo apt install python3.13-dev
pip install gdal==<your GDAL version>
```

Ensure GDAL is properly installed and can be imported:

```python
from osgeo import gdal
```

## Notebooks

| Notebook                              | Description                                                                                                                                                                                                                                                                                      | Output file                                                                                  |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| **Exploration notebooks**             |                                                                                                                                                                                                                                                                                                  |                                                                                              |
| `explore_dist_alert.ipynb`            | Initial exploration of DIST-ALERT, which monitors disturbances in vegetation cover.                                                                                                                                                                                                              | -                                                                                            |
| `explore_sufosat.ipynb`               | Initial exploration of SUFOSAT's data.                                                                                                                                                                                                                                                           | -                                                                                            |
| `explore_sufosat_nat2000_ign.ipynb`   | Initial exploration of SUFOSAT, IGN, and Natura 2000 data.                                                                                                                                                                                                                                       | -                                                                                            |
| **Data preprocessing notebooks**      |                                                                                                                                                                                                                                                                                                  |                                                                                              |
| `prepare_sufosat_{v2,v3}_layer.ipynb` | Generates a FlatGeobuf vector file containing polygons of clear-cut areas detected in France since January 2024, derived from SUFOSAT data. The polygons include attributes such as start date, end date, duration, number of merged polygons, and area.                                         | `data/sufosat/sufosat_clear_cuts_2024.fgb`                                                   |
| `prepare_natura2000.ipynb`            | _Work in progress_                                                                                                                                                                                                                                                                               | _Work in progress_                                                                           |
| `prepare_ign_slope_raster.ipynb`      | Generates a compressed GeoTIFF raster indicating terrain slopes >= 30% across France, based on the IGN BD ALTI digital elevation model. Pixels meeting this condition are assigned a value of 1. Also responsible for vectorizing the raster into a FlatGeobuf file.                             | `data/ign/bdalti25/slope_gte_30.tif`, `data/ign/bdalti25/slope_gte_30.fgb`                   |
| `prepare_cadastre.ipynb`              | Generates FlatGeobuf files that delineate the boundaries of cities (with Etalab as the source) and departments (with OpenStreetMap as the source) across France.                                                                                                                                 | `data/cadastre/cadastre_france_cities.fgb` , `data/cadastre/cadastre_france_departments.fgb` |
| **Statistic notebooks**               |                                                                                                                                                                                                                                                                                                  |                                                                                              |
| `stats_abusive_clear_cuts.ipynb`      | Produces a FlatGeobuf file containing SUFOSAT clear-cut geometries (>= 0.5 ha) along with their intersection areas with Natura2000 zones and slopes >= 30%. We also include the associated department and city INSEE code. The filtering of abusive clear-cuts is left to consumers of the file. | `data/abusive_clear_cuts/abusive_clear_cuts_2024.fgb`                                        |
| `stats_example_from_raster.ipynb`     | Example notebook to derive statistics from raster files                                                                                                                                                                                                                                          | -                                                                                            |

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
