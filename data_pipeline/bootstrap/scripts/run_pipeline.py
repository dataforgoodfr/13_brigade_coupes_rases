from scripts.enrich_sufosat_clusters import enrich_sufosat_clusters
from scripts.preprocess_bdforet import preprocess_bdforet
from scripts.preprocess_cadastre_cities import preprocess_cadastre_cities
from scripts.preprocess_natura2000 import preprocess_natura2000
from scripts.preprocess_slope import preprocess_slope
from scripts.preprocess_sufosat import preprocess_sufosat


def run_pipeline() -> None:
    preprocess_sufosat()
    preprocess_bdforet()
    preprocess_slope()
    preprocess_natura2000()
    preprocess_cadastre_cities()
    enrich_sufosat_clusters()


if __name__ == "__main__":
    run_pipeline()
