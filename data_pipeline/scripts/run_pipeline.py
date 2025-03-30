from scripts.preprocess_cadastre_cities import preprocess_cadastre_cities
from scripts.preprocess_cadastre_departments import preprocess_cadastre_departments
from scripts.preprocess_natura2000 import preprocess_natura2000
from scripts.preprocess_slope import preprocess_slope
from scripts.preprocess_sufosat import preprocess_sufosat


def run_pipeline() -> None:
    preprocess_sufosat()
    preprocess_slope()
    preprocess_natura2000()
    preprocess_cadastre_departments()
    preprocess_cadastre_cities()


if __name__ == "__main__":
    run_pipeline()
