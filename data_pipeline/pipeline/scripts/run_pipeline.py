from pipeline.scripts.get_sufosat_tiff import get_sufosat_tiff
from pipeline.scripts.get_reference_data import get_enrichment_data
from pipeline.scripts.enrich_sufosat_clusters import enrich_sufosat_clusters
from pipeline.scripts.preprocess_sufosat import preprocess_sufosat

# TODO : ajouter une méthode de récupération des fichiers de configuration pour les paramètres de la pipeline
def run_pipeline() -> None:
    # Step : Extract
    # get_sufosat_tiff() # Sufosat TIFF files
    get_enrichment_data()  # Enrichment data (e.g., weather, soil)

    # Step : Transform
    # preprocess_sufosat() # first step (extract)
    # enrich_sufosat_clusters()  # Step 3: Enrich sufosat

    # Step : Load



if __name__ == "__main__":
    run_pipeline()
