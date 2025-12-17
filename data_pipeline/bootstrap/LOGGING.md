# Guide du Système de Logging dans data_pipeline/bootstrap

Ce document explique comment fonctionne le système de logging dans le répertoire `data_pipeline/bootstrap`.

## Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Configuration de base](#configuration-de-base)
3. [Utilisation du logging dans le code](#utilisation-du-logging-dans-le-code)
4. [Le décorateur `@log_execution`](#le-décorateur-log_execution)
5. [Exemples pratiques](#exemples-pratiques)
6. [Bonnes pratiques](#bonnes-pratiques)

---

## Vue d'ensemble

Le système de logging dans `data_pipeline/bootstrap` utilise le module standard Python `logging` pour tracer l'exécution des scripts de traitement de données. Il permet de :

- **Suivre la progression** des opérations longues
- **Déboguer** les problèmes en production
- **Auditer** les transformations de données
- **Éviter les re-exécutions inutiles** grâce au décorateur `@log_execution`

## Configuration de base

La configuration du logging est centralisée dans le fichier `scripts/__init__.py` :

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s][%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
```

### Détail de la configuration

| Paramètre | Valeur | Description |
|-----------|--------|-------------|
| `level` | `logging.INFO` | Niveau de log minimum (INFO, WARNING, ERROR) |
| `format` | `"[%(asctime)s][%(levelname)s] %(message)s"` | Format des messages de log |
| `datefmt` | `"%H:%M:%S"` | Format de l'heure (heures:minutes:secondes) |

**Exemple de sortie** :
```
[14:23:45][INFO] Starting to seed ecological_zonings table
[14:23:46][INFO] Loading Natura 2000 codes
[14:23:47][INFO] ecological_zonings table seeded successfully
```

## Utilisation du logging dans le code

Une fois la configuration effectuée dans `__init__.py`, tous les modules peuvent utiliser le logging directement :

```python
import logging

# Utilisation directe du module logging
logging.info("Message d'information")
logging.warning("Message d'avertissement")
logging.error("Message d'erreur")
```

### Niveaux de log disponibles

1. **`logging.info()`** - Pour les informations de progression normale
   ```python
   logging.info("Fetching city IDs from database")
   logging.info(f"Created {len(clusters)} clear-cut clusters")
   ```

2. **`logging.warning()`** - Pour les situations anormales mais non critiques
   ```python
   logging.warning(f"Found {missing_city_ids} records with missing city_id")
   logging.warning("Danger zone - Starting database wipe operation")
   ```

3. **`logging.error()`** - Pour les erreurs qui empêchent une opération
   ```python
   logging.error("Failed to connect to database")
   ```

## Le décorateur `@log_execution`

Le décorateur `@log_execution` est un outil puissant situé dans `scripts/utils/log_execution.py`. Il permet d'ajouter automatiquement :

- Un **message de début** d'exécution
- Un **message de fin** avec la durée totale
- Un **mécanisme de skip** si le résultat existe déjà

### Fonctionnement du décorateur

```python
from bootstrap.scripts.utils import log_execution

@log_execution([RESULT_FILEPATH])
def preprocess_sufosat() -> None:
    """Traite les données SUFOSAT."""
    # Votre code ici
    pass
```

### Ce que fait le décorateur

#### 1. Vérification de l'existence du fichier

Avant d'exécuter la fonction, le décorateur vérifie si le fichier de résultat existe déjà :

```python
if Path(RESULT_FILEPATH).exists():
    logging.info(
        f"The result filepath {RESULT_FILEPATH} already exists, "
        "we're skipping this job."
    )
    return None  # La fonction n'est pas exécutée
```

#### 2. Logs de début et de fin

Si le fichier n'existe pas, la fonction s'exécute avec des logs encadrants :

```
[14:23:45][INFO] [============  Start of the preprocess_sufosat script ============]
... (logs de la fonction)
[14:28:12][INFO] [============  End of the preprocess_sufosat script. Total duration: 4min 27s ============]
```

#### 3. Mesure du temps d'exécution

Le décorateur utilise `time.perf_counter()` pour mesurer précisément la durée :

```python
start_time = time.perf_counter()
result = func(*args, **kwargs)
end_time = time.perf_counter()
```

Le temps est formaté de manière lisible grâce à la fonction `_format_time()` :
- `< 1s` : affiché en millisecondes, microsecondes ou nanosecondes
- `≥ 1min` : affiché en jours, heures, minutes et secondes (ex: "2h 15min 30s")

### Utilisation avec plusieurs fichiers

Le décorateur peut accepter une liste de fichiers :

```python
@log_execution([FILE1, FILE2, FILE3])
def process_multiple_outputs() -> None:
    """Génère plusieurs fichiers."""
    pass
```

La fonction ne sera exécutée que si **tous** les fichiers sont absents. Si **au moins un** fichier manque, la fonction s'exécute complètement.

## Exemples pratiques

### Exemple 1 : Script de préprocessing simple

```python
# preprocess_natura2000.py
import logging
from pathlib import Path
from bootstrap.scripts.utils import log_execution

RESULT_FILEPATH = Path("data/natura2000/natura2000_concat.fgb")

@log_execution([RESULT_FILEPATH])
def preprocess_natura2000() -> None:
    """Prétraite les données Natura 2000."""
    
    logging.info("Loading Natura 2000 raw data")
    # ... chargement des données
    
    logging.info("Transforming coordinates to Lambert-93")
    # ... transformation
    
    logging.info("Saving processed data")
    # ... sauvegarde
    
    logging.info("Natura 2000 preprocessing completed")
```

**Sortie console** :
```
[14:23:45][INFO] [============  Start of the preprocess_natura2000 script ============]
[14:23:45][INFO] Loading Natura 2000 raw data
[14:23:50][INFO] Transforming coordinates to Lambert-93
[14:24:10][INFO] Saving processed data
[14:24:15][INFO] Natura 2000 preprocessing completed
[14:24:15][INFO] [============  End of the preprocess_natura2000 script. Total duration: 30s ============]
```

### Exemple 2 : Classe avec logging (DatabaseSeeder)

```python
# seed_database.py
import logging
from sqlalchemy import create_engine

class DatabaseSeeder:
    """Gère l'insertion des données dans la base."""
    
    def __init__(self, database_url: str):
        logging.info("Initializing DatabaseSeeder")
        self.engine = create_engine(database_url)
        logging.info("Database connection successful")
    
    def insert_records(self, df, table: str) -> None:
        logging.info(f"Inserting {len(df)} records into {table}")
        df.to_sql(table, con=self.engine, if_exists="append")
        logging.info(f"{table} records inserted successfully")
```

### Exemple 3 : Logging avec des warnings

```python
def add_city_id_to_sufosat(sufosat):
    logging.info("Fetching city IDs from database")
    city_ids = fetch_cities()
    
    sufosat = sufosat.merge(city_ids, on="city_insee_code", how="left")
    
    missing_city_ids = sufosat["city_id"].isna().sum()
    if missing_city_ids:
        logging.warning(f"Found {missing_city_ids} records with missing city_id")
    
    # Nettoyage
    sufosat = sufosat.dropna(subset="city_id")
    logging.info(f"After cleaning: {len(sufosat)} records remain")
    
    return sufosat
```

## Bonnes pratiques

### ✅ À faire

1. **Utiliser des messages descriptifs**
   ```python
   # Bon
   logging.info(f"Processing {len(data)} records from {source_file}")
   
   # Moins bon
   logging.info("Processing data")
   ```

2. **Logger les étapes importantes**
   ```python
   logging.info("Starting spatial join operation")
   result = gdf1.sjoin(gdf2)
   logging.info(f"Spatial join completed: {len(result)} intersections found")
   ```

3. **Utiliser le bon niveau de log**
   ```python
   logging.info("Normal operation")         # Progression normale
   logging.warning("Unexpected situation")  # Situation anormale mais gérable
   logging.error("Critical failure")        # Erreur critique
   ```

4. **Inclure des statistiques utiles**
   ```python
   logging.info(
       f"Clustering complete:\n"
       f"- Number of clusters: {n_clusters}\n"
       f"- Largest cluster: {max_size} polygons\n"
       f"- Processing time: {duration}s"
   )
   ```

### ❌ À éviter

1. **Trop de logs dans des boucles serrées**
   ```python
   # Éviter ceci
   for i in range(1000000):
       logging.info(f"Processing item {i}")  # Trop verbeux !
   
   # Préférer ceci
   for i in range(1000000):
       if i % 10000 == 0:
           logging.info(f"Processed {i}/1000000 items")
   ```

2. **Logger des informations sensibles**
   ```python
   # Ne JAMAIS faire ceci
   logging.info(f"Database password: {password}")
   logging.info(f"API key: {api_key}")
   ```

3. **Logger sans contexte**
   ```python
   # Mauvais
   logging.info("Done")
   
   # Bon
   logging.info("Database seeding completed successfully")
   ```

## Architecture du système

```
data_pipeline/bootstrap/
├── scripts/
│   ├── __init__.py                    # Configuration centrale du logging
│   ├── run_pipeline.py                # Orchestre tous les scripts
│   ├── seed_database.py               # Utilise logging.info/warning
│   ├── preprocess_sufosat.py          # Utilise @log_execution
│   ├── enrich_sufosat_clusters.py     # Utilise @log_execution
│   └── utils/
│       └── log_execution.py           # Décorateur @log_execution
```

## Questions fréquentes

### Comment changer le niveau de log ?

Modifiez `level=logging.INFO` dans `scripts/__init__.py` :

```python
# Pour voir tous les logs (y compris DEBUG)
logging.basicConfig(level=logging.DEBUG, ...)

# Pour ne voir que les warnings et erreurs
logging.basicConfig(level=logging.WARNING, ...)
```

### Comment logger dans un fichier ?

Ajoutez un `FileHandler` dans `scripts/__init__.py` :

```python
import logging

# Configuration pour logger dans un fichier ET la console
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s][%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
    handlers=[
        logging.FileHandler("pipeline.log"),
        logging.StreamHandler()
    ]
)
```

### Le décorateur `@log_execution` empêche la ré-exécution, comment forcer ?

Supprimez manuellement le fichier de résultat avant de relancer :

```bash
rm bootstrap/data/sufosat/sufosat_clusters.fgb
python -m bootstrap.scripts.preprocess_sufosat
```

### Comment désactiver temporairement le logging ?

```python
import logging

# Au début de votre script
logging.disable(logging.INFO)  # Désactive INFO et DEBUG
# ou
logging.disable(logging.CRITICAL)  # Désactive tout
```

---

## Résumé

Le système de logging dans `data_pipeline/bootstrap` est simple mais efficace :

1. **Configuration centralisée** dans `scripts/__init__.py`
2. **Utilisation directe** de `logging.info()`, `logging.warning()`, etc.
3. **Décorateur `@log_execution`** pour automatiser les logs de début/fin et éviter les re-runs
4. **Format cohérent** : `[HH:MM:SS][LEVEL] message`

Pour toute question supplémentaire, consultez les exemples dans les scripts existants ou la documentation Python officielle : https://docs.python.org/3/library/logging.html
