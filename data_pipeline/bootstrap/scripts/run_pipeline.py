from scripts.preprocess import (
    preprocess_cadastre_departments,
    preprocess_natura2000,
    preprocess_slope,
    preprocess_sufosat,
)


def run_pipeline() -> None:
    preprocess_sufosat()
    preprocess_slope()
    preprocess_natura2000()
    preprocess_cadastre_departments()


if __name__ == "__main__":
    run_pipeline()
