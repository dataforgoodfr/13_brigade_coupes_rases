from scripts.modules.cities import preprocess_cadastre_cities
from scripts.modules.departments import preprocess_cadastre_departments
from scripts.modules.natura2000 import preprocess_natura2000
from scripts.modules.slope import preprocess_slope
from scripts.modules.sufosat import preprocess_sufosat

if __name__ == "__main__":
    preprocess_cadastre_cities()
    preprocess_cadastre_departments()
    preprocess_natura2000()
    preprocess_slope()
    preprocess_sufosat()
