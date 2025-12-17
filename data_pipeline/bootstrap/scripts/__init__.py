import logging
from pathlib import Path

# Configuration centrale du logging pour tous les scripts de bootstrap
# Cette configuration est automatiquement appliquée lors de l'import de modules bootstrap.scripts
logging.basicConfig(
    level=logging.INFO,  # Niveau de log : INFO, WARNING, ERROR seront affichés
    format="[%(asctime)s][%(levelname)s] %(message)s",  # Format : [HH:MM:SS][INFO] message
    datefmt="%H:%M:%S",  # Format de l'heure : heures:minutes:secondes
)

DATA_DIR = Path(__file__).parent.parent / "data"
