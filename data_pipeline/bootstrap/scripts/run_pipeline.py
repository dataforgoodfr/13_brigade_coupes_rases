from scripts.preprocess import preprocess_sufosat, preprocess_slope, preprocess_natura2000, preprocess_cadastre_cities, preprocess_cadastre_departments
from scripts.enrich import enrich_sufosat_clusters

def run_pipeline() -> None:
    preprocess_sufosat()
    preprocess_slope()
    preprocess_natura2000()
    preprocess_cadastre_departments()

if __name__ == "__main__":
    run_pipeline()
