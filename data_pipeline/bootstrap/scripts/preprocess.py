from script.modules.cities import preprocess_cadastre_cities
from script.modules.departments import preprocess_cadastre_departments
from script.modules.natura2000 import preprocess_natura2000
from script.modules.slope import preprocess_slope
from script.modules.sufosat import preprocess_sufosat

    
if __name__ == "__main__":
    preprocess_cadastre_cities()
    preprocess_cadastre_departments()
    preprocess_natura2000()
    preprocess_slope()
    preprocess_sufosat()
