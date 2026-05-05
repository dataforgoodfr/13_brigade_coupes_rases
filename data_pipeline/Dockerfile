# # # # # # # # # # # #
# Image docker de run #
# # # # # # # # # # # #

# Clever (and most CI) use the git repo root as Docker build context while
# CC_DOCKERFILE points at this file — paths must be prefixed with data_pipeline/.
FROM condaforge/miniforge3:latest

WORKDIR /app/data_pipeline

# Installe les dépendances système nécessaires pour GDAL et PostgreSQL
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Crée l'environnement conda avec Python 3.13 + GDAL en une seule passe
# (deux appels conda séparés doublent le pic mémoire du solveur)
ENV CONDA_ALWAYS_YES=true
RUN mamba create -y -n py3_13 python=3.13 gdal -c conda-forge && \
    mamba clean -afy

# Python du projet en premier, puis conda base (où se trouve poetry)
ENV PATH="/opt/conda/envs/py3_13/bin:/opt/conda/bin:${PATH}"

# Installe Poetry dans l'env de base
RUN conda install -y -n base -c conda-forge poetry && conda clean -afy

# Configure Poetry pour ne pas créer de virtualenv (on utilise déjà conda)
RUN poetry config virtualenvs.create false

# Copie les fichiers de configuration Poetry (context = repo root)
COPY data_pipeline/pyproject.toml data_pipeline/poetry.lock* ./

# Installe les dépendances du projet
RUN poetry install --no-interaction --no-ansi --no-root

# Copie le code du sous-projet pipeline
COPY data_pipeline/ ./

# Installe le projet lui-même
RUN poetry install --no-interaction --no-ansi --only-root

# Force l'utilisation des bibliothèques conda (dont libstdc++ récent)
ENV LD_LIBRARY_PATH=/opt/conda/envs/py3_13/lib

# Commande par défaut pour lancer la pipeline
CMD ["python", "-m", "pipeline.scripts.run_pipeline"]
